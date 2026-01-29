import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAIProvider, getProviderFromModel } from "@/lib/ai";
import { chatRequestSchema, validateRequest } from "@/lib/validation";
import { checkIPRateLimit, checkMessageQuota } from "@/lib/rate-limiter";
import { incrementMessageCount, getUserUsage } from "@/lib/usage-tracker";
import { sanitizeChatMessage } from "@/lib/security";
import { canAccessModel } from "@/lib/subscription-tiers";
import { logger } from "@/lib/logger";
import { AIModel, SubscriptionTier } from "@/types/database";
import type { ChatMessage } from "@/lib/ai/types";

/**
 * Chat API Route
 * Handles streaming chat completions with multi-provider support
 */

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // IP Rate limiting - parse common headers robustly
        const xff = request.headers.get("x-forwarded-for");
        const ipCandidate = xff ? xff.split(",")[0].trim() : request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? request.headers.get("true-client-ip") ?? null;
        if (!ipCandidate) {
            return NextResponse.json({ error: "Could not determine client IP" }, { status: 400 });
        }
        const ip = ipCandidate;
        const ipCheck = checkIPRateLimit(ip);
        if (!ipCheck.allowed) {
            return NextResponse.json(
                { error: ipCheck.error },
                { status: 429, headers: { "Retry-After": String(Math.ceil((ipCheck.resetAt - Date.now()) / 1000)) } }
            );
        }

        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile for subscription tier
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", user.id)
            .single();

        if (profileError) {
            logger.error("Failed to fetch profile", profileError);
            return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
        }

        const tier: SubscriptionTier = profile?.subscription_tier || "free";

        // Check message quota
        const usage = await getUserUsage(user.id);
        const quotaCheck = checkMessageQuota(tier, usage.messagesUsed);
        if (!quotaCheck.allowed) {
            return NextResponse.json(
                { error: quotaCheck.error, usage },
                { status: 429 }
            );
        }

        // Parse and validate request
        let messages: any;
        let model: AIModel;
        let chatId: string | undefined;
        try {
            const body = await request.json();
            const parsed = validateRequest(chatRequestSchema, body);
            messages = parsed.messages;
            model = parsed.model;
            chatId = parsed.chatId;
        } catch (err: unknown) {
            // Client error (malformed JSON or validation error)
            const e = err instanceof Error ? err : new Error(String(err));
            logger.error("Client request validation failed", e);
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        // Check model access
        if (!canAccessModel(tier, model)) {
            return NextResponse.json(
                { error: `Your subscription tier does not include access to ${model}` },
                { status: 403 }
            );
        }

        // Sanitize messages
        const sanitizedMessages = (messages as ChatMessage[]).map((m: ChatMessage) => ({
            ...m,
            content: sanitizeChatMessage(m.content),
        }));

        // Get API key based on provider
        const provider = getProviderFromModel(model);
        const apiKey = getApiKeyForProvider(provider);

        if (!apiKey) {
            return NextResponse.json(
                { error: `API key not configured for ${provider}` },
                { status: 500 }
            );
        }

        // Create AI provider
        const aiProvider = createAIProvider(provider, {
            apiKey,
            model: model as AIModel,
        });

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let totalTokens = 0;
                let fullContent = "";

                try {
                    await aiProvider.streamChat(sanitizedMessages, {
                        onToken: (token) => {
                            fullContent += token;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                            );
                        },
                        onComplete: async (content, usage) => {
                            try {
                                totalTokens = usage.total_tokens;

                                // Save message to database
                                if (chatId) {
                                    const res = await supabase.from("messages").insert([
                                        {
                                            chat_id: chatId,
                                            role: "assistant",
                                            content,
                                            tokens_used: usage.total_tokens,
                                            model,
                                            metadata: { provider, latency_ms: Date.now() - startTime },
                                        },
                                    ]);

                                    if (res.error) {
                                        logger.error("Failed to insert message in onComplete", res.error);
                                        controller.enqueue(
                                            encoder.encode(
                                                `data: ${JSON.stringify({ error: "Failed to persist message" })}\n\n`
                                            )
                                        );
                                        controller.close();
                                        return;
                                    }

                                    // Update chat's updated_at
                                    const updated = await supabase
                                        .from("chats")
                                        .update({ updated_at: new Date().toISOString() })
                                        .eq("id", chatId);

                                    if (updated.error) {
                                        logger.error("Failed to update chat updated_at", updated.error);
                                    }
                                }

                                // Increment usage
                                await incrementMessageCount(user.id, usage.total_tokens);

                                controller.enqueue(
                                    encoder.encode(
                                        `data: ${JSON.stringify({ done: true, usage })}\n\n`
                                    )
                                );
                                controller.close();

                                // Log completion
                                logger.chat("complete", user.id, model, totalTokens);
                            } catch (err) {
                                logger.error("onComplete handler failed", err as Error);
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "An internal error occurred while finalizing the response" })}\n\n`));
                                controller.close();
                            }
                        },
                        onError: (error) => {
                            // Log full error server-side, but send a sanitized message to the client
                            logger.error("Chat stream error", error, { userId: user.id, model });
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({ error: "An internal error occurred while generating the response" })}\n\n`
                                )
                            );
                            controller.close();
                        },
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Stream error";
                    // Sanitize outbound message
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: "An internal error occurred while generating the response" })}\n\n`)
                    );
                    controller.close();
                    logger.error("Stream failure", error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Internal error";
        logger.error("Chat API error", error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

function getApiKeyForProvider(provider: string): string | undefined {
    switch (provider) {
        case "openai":
            return process.env.OPENAI_API_KEY;
        case "anthropic":
            return process.env.ANTHROPIC_API_KEY;
        case "google":
            return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        default:
            return undefined;
    }
}
