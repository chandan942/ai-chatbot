/**
 * Database types matching the Supabase schema
 */

export interface Profile {
    id: string;
    email: string;
    subscription_status: "active" | "canceled" | "past_due" | "trialing";
    subscription_tier: SubscriptionTier;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_end_date: string | null;
    created_at: string;
    updated_at: string;
}

export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface Chat {
    id: string;
    user_id: string;
    title: string;
    model_used: AIModel;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    role: "user" | "assistant";
    content: string;
    tokens_used: number | null;
    model: AIModel | null;
    metadata: MessageMetadata | null;
    created_at: string;
}

export interface MessageMetadata {
    provider?: AIProvider;
    latency_ms?: number;
    finish_reason?: string;
    [key: string]: unknown;
}

export interface UsageLog {
    id: string;
    user_id: string;
    messages_count: number;
    tokens_used: number;
    period_start: string;
    period_end: string;
}

// AI Provider and Model types
export type AIProvider = "openai" | "anthropic" | "google";

export type AIModel =
    // OpenAI models
    | "gpt-3.5-turbo"
    | "gpt-4"
    | "gpt-4-turbo"
    | "gpt-4o"
    // Anthropic models
    | "claude-3-haiku-20240307"
    | "claude-3-sonnet-20240229"
    | "claude-3-opus-20240229"
    | "claude-3-5-sonnet-20241022"
    // Google models
    | "gemini-pro"
    | "gemini-1.5-pro"
    | "gemini-1.5-flash";

// Database table types for Supabase operations
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, "created_at" | "updated_at">;
                Update: Partial<Omit<Profile, "id" | "created_at">>;
            };
            chats: {
                Row: Chat;
                Insert: Omit<Chat, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<Chat, "id" | "created_at">>;
            };
            messages: {
                Row: Message;
                Insert: Omit<Message, "id" | "created_at">;
                Update: Partial<Omit<Message, "id" | "created_at">>;
            };
            usage_logs: {
                Row: UsageLog;
                Insert: Omit<UsageLog, "id">;
                Update: Partial<Omit<UsageLog, "id">>;
            };
        };
    };
};
