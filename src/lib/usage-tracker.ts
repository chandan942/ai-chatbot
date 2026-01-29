import { createClient } from "@/lib/supabase/server";
import { SubscriptionTier } from "@/types/database";

/**
 * Usage Tracker
 * Tracks message counts and token usage per user per month
 */

export interface UsageStats {
    messagesUsed: number;
    tokensUsed: number;
    periodStart: Date;
    periodEnd: Date;
}

/**
 * Get current month's usage for a user
 */
export async function getUserUsage(userId: string): Promise<UsageStats> {
    const supabase = await createClient();
    const { periodStart, periodEnd } = getCurrentPeriod();

    const { data, error } = await supabase
        .from("usage_logs")
        .select("messages_count, tokens_used")
        .eq("user_id", userId)
        .gte("period_start", periodStart.toISOString())
        .lte("period_end", periodEnd.toISOString())
        .single();

    if (error || !data) {
        // No usage record yet for this period
        return {
            messagesUsed: 0,
            tokensUsed: 0,
            periodStart,
            periodEnd,
        };
    }

    return {
        messagesUsed: data.messages_count,
        tokensUsed: data.tokens_used,
        periodStart,
        periodEnd,
    };
}

/**
 * Increment message count for a user
 */
export async function incrementMessageCount(
    userId: string,
    tokensUsed: number = 0
): Promise<void> {
    const supabase = await createClient();
    const { periodStart, periodEnd } = getCurrentPeriod();

    // Try to update existing record
    const { data: existingRecord } = await supabase
        .from("usage_logs")
        .select("id, messages_count, tokens_used")
        .eq("user_id", userId)
        .gte("period_start", periodStart.toISOString())
        .lte("period_end", periodEnd.toISOString())
        .single();

    if (existingRecord) {
        // Update existing record
        await supabase
            .from("usage_logs")
            .update({
                messages_count: existingRecord.messages_count + 1,
                tokens_used: existingRecord.tokens_used + tokensUsed,
            })
            .eq("id", existingRecord.id);
    } else {
        // Create new record for this period
        await supabase.from("usage_logs").insert({
            user_id: userId,
            messages_count: 1,
            tokens_used: tokensUsed,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
        });
    }
}

/**
 * Check if user can send a message based on their tier and usage
 */
export async function canSendMessage(
    userId: string,
    tier: SubscriptionTier
): Promise<{ allowed: boolean; usage: UsageStats; error?: string }> {
    const usage = await getUserUsage(userId);

    // Import here to avoid circular dependency
    const { checkMessageQuota } = await import("./rate-limiter");
    const result = checkMessageQuota(tier, usage.messagesUsed);

    return {
        allowed: result.allowed,
        usage,
        error: result.error,
    };
}

/**
 * Get the current billing period (monthly)
 */
function getCurrentPeriod(): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { periodStart, periodEnd };
}

/**
 * Get usage percentage (for UI display)
 */
export function getUsagePercentage(used: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Check if user is near their limit (> 80%)
 */
export function isNearLimit(used: number, limit: number): boolean {
    if (limit === -1) return false; // Unlimited
    return (used / limit) > 0.8;
}
