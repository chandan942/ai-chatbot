import { AIProvider } from "@/types/database";

// Re-export all types from the shared types file
export type {
    ChatMessage,
    StreamCallbacks,
    TokenUsage,
    AIProviderConfig,
    AIProviderInterface,
} from "./types";

// Import types for use in this file
import type { AIProviderConfig, AIProviderInterface } from "./types";

// Provider implementations
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./gemini";

/**
 * Factory function to create the appropriate AI provider
 */
export function createAIProvider(
    provider: AIProvider,
    config: AIProviderConfig
): AIProviderInterface {
    switch (provider) {
        case "openai":
            return new OpenAIProvider(config);
        case "anthropic":
            return new AnthropicProvider(config);
        case "google":
            return new GoogleProvider(config);
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

/**
 * Get provider from model name
 */
export function getProviderFromModel(model: string): AIProvider {
    const m = model.toLowerCase();
    if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3")) return "openai";
    if (m.startsWith("claude")) return "anthropic";
    if (m.startsWith("gemini")) return "google";
    throw new Error(`Unknown model: ${model}`);
}
