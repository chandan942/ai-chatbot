import OpenAI from "openai";
import {
    AIProviderInterface,
    AIProviderConfig,
    ChatMessage,
    StreamCallbacks,
    TokenUsage,
} from "./types";

/**
 * OpenAI Provider Implementation
 * Supports GPT-3.5, GPT-4, and GPT-4o models with streaming
 */
export class OpenAIProvider implements AIProviderInterface {
    provider = "openai" as const;
    private client: OpenAI;
    private config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
    }

    async streamChat(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
        try {
            const stream = await this.client.chat.completions.create({
                model: this.config.model,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                temperature: this.config.temperature ?? 0.7,
                max_tokens: this.config.maxTokens ?? 4096,
                stream: true,
                stream_options: { include_usage: true },
            });

            let fullContent = "";
            let usage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    fullContent += content;
                    callbacks.onToken(content);
                }

                // Usage is included in the last chunk
                if (chunk.usage) {
                    usage = {
                        prompt_tokens: chunk.usage.prompt_tokens,
                        completion_tokens: chunk.usage.completion_tokens,
                        total_tokens: chunk.usage.total_tokens,
                    };
                }
            }

            callbacks.onComplete(fullContent, usage);
        } catch (error: any) {
            console.error("========= OPENAI ERROR =========");
            console.error("Error message:", error?.message);
            console.error("Error name:", error?.name);
            console.error("Error status:", error?.status);
            console.error("Full error:", JSON.stringify(error, null, 2));
            console.error("================================");
            callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async chat(messages: ChatMessage[]): Promise<{ content: string; usage: TokenUsage }> {
        const response = await this.client.chat.completions.create({
            model: this.config.model,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: this.config.temperature ?? 0.7,
            max_tokens: this.config.maxTokens ?? 4096,
        });

        return {
            content: response.choices[0]?.message?.content || "",
            usage: {
                prompt_tokens: response.usage?.prompt_tokens || 0,
                completion_tokens: response.usage?.completion_tokens || 0,
                total_tokens: response.usage?.total_tokens || 0,
            },
        };
    }
}
