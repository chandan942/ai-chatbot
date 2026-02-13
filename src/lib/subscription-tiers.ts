import { AIModel, SubscriptionTier } from "@/types/database";

/**
 * Subscription tier configuration
 * Defines pricing, limits, and available features per tier
 */

export interface TierConfig {
    name: string;
    price: number;
    messagesPerMonth: number; // -1 = unlimited
    models: AIModel[];
    features: string[];
}

/**
 * Get subscription limits for a specific tier
 */
export function getSubscriptionLimits(tier: string): TierConfig {
    return TIERS[tier as SubscriptionTier] || TIERS.free;
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
    free: {
        name: "Free",
        price: 0,
        messagesPerMonth: 50,
        models: ["gpt-3.5-turbo", "gemini-pro", "gemini-2.0-flash"],
        features: ["basic_chat"],
    },
    pro: {
        name: "Pro",
        price: 10,
        messagesPerMonth: 1000,
        models: [
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4o",
            "claude-3-sonnet-20240229",
            "claude-3-5-sonnet-20241022",
            "gemini-pro",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        ],
        features: ["basic_chat", "chat_history", "export", "regenerate", "edit_message"],
    },
    enterprise: {
        name: "Enterprise",
        price: 50,
        messagesPerMonth: -1, // Unlimited
        models: [
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-turbo",
            "gpt-4o",
            "claude-3-haiku-20240307",
            "claude-3-sonnet-20240229",
            "claude-3-opus-20240229",
            "claude-3-5-sonnet-20241022",
            "gemini-pro",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        ],
        features: [
            "basic_chat",
            "chat_history",
            "export",
            "regenerate",
            "edit_message",
            "priority_support",
            "custom_models",
            "api_access",
        ],
    },
};

/**
 * Check if a user tier has access to a specific model
 */
export function canAccessModel(tier: SubscriptionTier, model: AIModel): boolean {
    return TIERS[tier].models.includes(model);
}

/**
 * Check if a user tier has a specific feature
 */
export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
    return TIERS[tier].features.includes(feature) || TIERS[tier].features.includes("all");
}

/**
 * Get the message limit for a tier
 */
export function getMessageLimit(tier: SubscriptionTier): number {
    return TIERS[tier].messagesPerMonth;
}

/**
 * Check if tier has unlimited messages
 */
export function isUnlimited(tier: SubscriptionTier): boolean {
    return TIERS[tier].messagesPerMonth === -1;
}

/**
 * Get display name for a model
 */
export function getModelDisplayName(model: AIModel): string {
    const displayNames: Record<AIModel, string> = {
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "gpt-4": "GPT-4",
        "gpt-4-turbo": "GPT-4 Turbo",
        "gpt-4o": "GPT-4o",
        "claude-3-haiku-20240307": "Claude 3 Haiku",
        "claude-3-sonnet-20240229": "Claude 3 Sonnet",
        "claude-3-opus-20240229": "Claude 3 Opus",
        "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
        "gemini-pro": "Gemini Pro",
        "gemini-1.5-pro": "Gemini 1.5 Pro",
        "gemini-1.5-flash": "Gemini 1.5 Flash",
        "gemini-2.0-flash": "Gemini 2.0 Flash",
    };
    return displayNames[model] || model;
}

/**
 * Get provider for a model
 */
export function getModelProvider(model: AIModel): "openai" | "anthropic" | "google" {
    if (model.startsWith("gpt")) return "openai";
    if (model.startsWith("claude")) return "anthropic";
    if (model.startsWith("gemini")) return "google";
    return "openai"; // Default fallback
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min(Math.round((used / limit) * 100), 100);
}

/**
 * Check if usage is near limit
 */
export function isNearLimit(used: number, limit: number, threshold = 0.8): boolean {
    if (limit === -1) return false; // Unlimited
    return (used / limit) >= threshold;
}
