import Anthropic from "@anthropic-ai/sdk";
import {
    AIProviderInterface,
    AIProviderConfig,
    ChatMessage,
    StreamCallbacks,
    TokenUsage,
} from "./types";

/**
 * Anthropic Provider Implementation
 * Supports Claude 3 models with streaming
 */
export class AnthropicProvider implements AIProviderInterface {
    provider = "anthropic" as const;
    private client: Anthropic;
    private config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
        this.client = new Anthropic({
            apiKey: config.apiKey,
        });
    }

    async streamChat(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
        try {
            // Separate system message from conversation messages
            const systemMessage = messages.find((m) => m.role === "system")?.content || "";
            const conversationMessages = messages
                .filter((m) => m.role !== "system")
                .map((m) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                }));

            const stream = await this.client.messages.stream({
                model: this.config.model,
                max_tokens: this.config.maxTokens ?? 4096,
                system: systemMessage,
                messages: conversationMessages,
            });

            let fullContent = "";

            for await (const event of stream) {
                if (
                    event.type === "content_block_delta" &&
                    event.delta.type === "text_delta"
                ) {
                    const content = event.delta.text;
                    fullContent += content;
                    callbacks.onToken(content);
                }
            }

            // Get final message for usage stats
            const finalMessage = await stream.finalMessage();
            const usage: TokenUsage = {
                prompt_tokens: finalMessage.usage.input_tokens,
                completion_tokens: finalMessage.usage.output_tokens,
                total_tokens:
                    finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
            };

            callbacks.onComplete(fullContent, usage);
        } catch (error) {
            callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async chat(messages: ChatMessage[]): Promise<{ content: string; usage: TokenUsage }> {
        try {
            // Separate system message from conversation messages
            const systemMessage = messages.find((m) => m.role === "system")?.content || "";
            const conversationMessages = messages
                .filter((m) => m.role !== "system")
                .map((m) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                }));

            const response = await this.client.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens ?? 4096,
                system: systemMessage,
                messages: conversationMessages,
            });

            const content =
                Array.isArray(response.content) && response.content.length > 0 && response.content[0].type === "text"
                    ? response.content[0].text
                    : "";

            return {
                content,
                usage: {
                    prompt_tokens: response.usage.input_tokens,
                    completion_tokens: response.usage.output_tokens,
                    total_tokens: response.usage.input_tokens + response.usage.output_tokens,
                },
            };
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            console.error("Anthropic chat failed", e);
            throw new Error(`Anthropic chat error: ${e.message}`);
        }
    }
}
