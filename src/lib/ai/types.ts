import { AIModel, AIProvider } from "@/types/database";

/**
 * Unified AI Provider Types
 * Shared types used by all AI provider implementations
 */

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface StreamCallbacks {
    onToken: (token: string) => void;
    onComplete: (fullContent: string, usage: TokenUsage) => void;
    onError: (error: Error) => void;
}

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface AIProviderConfig {
    apiKey: string;
    model: AIModel;
    temperature?: number;
    maxTokens?: number;
}

export interface AIProviderInterface {
    provider: AIProvider;

    /**
     * Send a chat completion request with streaming
     */
    streamChat(
        messages: ChatMessage[],
        callbacks: StreamCallbacks
    ): Promise<void>;

    /**
     * Send a non-streaming chat completion request
     */
    chat(messages: ChatMessage[]): Promise<{ content: string; usage: TokenUsage }>;
}
