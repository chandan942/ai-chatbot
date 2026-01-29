import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    AIProviderInterface,
    AIProviderConfig,
    ChatMessage,
    StreamCallbacks,
    TokenUsage,
} from "./types";

/**
 * Google Gemini Provider Implementation
 * Supports Gemini Pro and Gemini 1.5 models with streaming
 */
export class GoogleProvider implements AIProviderInterface {
    provider = "google" as const;
    private client: GoogleGenerativeAI;
    private config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
        this.client = new GoogleGenerativeAI(config.apiKey);
    }

    async streamChat(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model,
                generationConfig: {
                    temperature: this.config.temperature ?? 0.7,
                    maxOutputTokens: this.config.maxTokens ?? 4096,
                },
            });

            // Convert messages to Gemini format
            const systemInstruction = messages.find((m) => m.role === "system")?.content;
            const history = messages
                .filter((m) => m.role !== "system")
                .slice(0, -1) // All except the last message
                .map((m) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                }));

            const lastMessage = messages.filter((m) => m.role !== "system").slice(-1)[0];

            if (!lastMessage || !lastMessage.content || lastMessage.content.trim() === "") {
                throw new Error("No user message to send to Gemini");
            }

            const chat = model.startChat({
                history,
                systemInstruction: systemInstruction
                    ? { role: "user", parts: [{ text: systemInstruction }] }
                    : undefined,
            });

            const result = await chat.sendMessageStream(lastMessage.content);

            let fullContent = "";

            for await (const chunk of result.stream) {
                const content = chunk.text();
                if (content) {
                    fullContent += content;
                    callbacks.onToken(content);
                }
            }

            // Get usage from response (Gemini provides this differently)
            const response = await result.response;
            const usageMetadata = response.usageMetadata;

            const usage: TokenUsage = {
                prompt_tokens: usageMetadata?.promptTokenCount || 0,
                completion_tokens: usageMetadata?.candidatesTokenCount || 0,
                total_tokens: usageMetadata?.totalTokenCount || 0,
            };

            callbacks.onComplete(fullContent, usage);
        } catch (error) {
            callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async chat(messages: ChatMessage[]): Promise<{ content: string; usage: TokenUsage }> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model,
                generationConfig: {
                    temperature: this.config.temperature ?? 0.7,
                    maxOutputTokens: this.config.maxTokens ?? 4096,
                },
            });

            // Convert messages to Gemini format
            const systemInstruction = messages.find((m) => m.role === "system")?.content;
            const history = messages
                .filter((m) => m.role !== "system")
                .slice(0, -1)
                .map((m) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                }));

            const lastMessage = messages.filter((m) => m.role !== "system").slice(-1)[0];

            if (!lastMessage || !lastMessage.content || lastMessage.content.trim() === "") {
                throw new Error("No user message to send to Gemini");
            }

            const chat = model.startChat({
                history,
                systemInstruction: systemInstruction
                    ? { role: "user", parts: [{ text: systemInstruction }] }
                    : undefined,
            });

            const result = await chat.sendMessage(lastMessage.content);
            const response = result.response;
            const usageMetadata = response.usageMetadata;

            return {
                content: response.text(),
                usage: {
                    prompt_tokens: usageMetadata?.promptTokenCount || 0,
                    completion_tokens: usageMetadata?.candidatesTokenCount || 0,
                    total_tokens: usageMetadata?.totalTokenCount || 0,
                },
            };
        } catch (err) {
            // Re-throw a contextual error to aid debugging and keep behavior consistent
            const e = err instanceof Error ? err : new Error(String(err));
            throw new Error(`Gemini chat error: ${e.message}`);
        }
    }
}
