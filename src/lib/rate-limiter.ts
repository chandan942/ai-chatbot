import { SubscriptionTier } from "@/types/database";
import { getMessageLimit, isUnlimited } from "./subscription-tiers";

/**
 * Rate Limiter Implementation
 * - IP-based rate limiting (100 requests per 15 minutes)
 * - User-tier-based message limiting (monthly quotas)
 */

// In-memory store for IP rate limiting (use Redis in production)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const IP_RATE_LIMIT = 100; // requests
const IP_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes in ms

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
    error?: string;
}

/**
 * Check IP-based rate limit
 * Returns whether the request is allowed and remaining quota
 */
export function checkIPRateLimit(ip: string): RateLimitResult {
    const now = Date.now();
    const record = ipRequestCounts.get(ip);

    // First request or window expired
    if (!record || now > record.resetAt) {
        ipRequestCounts.set(ip, {
            count: 1,
            resetAt: now + IP_RATE_WINDOW,
        });
        return {
            allowed: true,
            remaining: IP_RATE_LIMIT - 1,
            limit: IP_RATE_LIMIT,
            resetAt: now + IP_RATE_WINDOW,
        };
    }

    // Within window, check count
    if (record.count >= IP_RATE_LIMIT) {
        return {
            allowed: false,
            remaining: 0,
            limit: IP_RATE_LIMIT,
            resetAt: record.resetAt,
            error: "Too many requests. Please try again later.",
        };
    }

    // Increment and allow
    record.count++;
    ipRequestCounts.set(ip, record);

    return {
        allowed: true,
        remaining: IP_RATE_LIMIT - record.count,
        limit: IP_RATE_LIMIT,
        resetAt: record.resetAt,
    };
}

/**
 * Check user's monthly message quota based on subscription tier
 */
export function checkMessageQuota(
    tier: SubscriptionTier,
    currentUsage: number
): RateLimitResult {
    // Unlimited tier
    if (isUnlimited(tier)) {
        return {
            allowed: true,
            remaining: -1, // -1 indicates unlimited
            limit: -1,
            resetAt: getMonthEndTimestamp(),
        };
    }

    const limit = getMessageLimit(tier);
    const remaining = Math.max(0, limit - currentUsage);

    if (currentUsage >= limit) {
        return {
            allowed: false,
            remaining: 0,
            limit,
            resetAt: getMonthEndTimestamp(),
            error: `Monthly message limit reached (${limit} messages). Upgrade your plan for more.`,
        };
    }

    return {
        allowed: true,
        remaining,
        limit,
        resetAt: getMonthEndTimestamp(),
    };
}

/**
 * Get timestamp for end of current month
 */
function getMonthEndTimestamp(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
}

/**
 * Clean up expired IP rate limit entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [ip, record] of ipRequestCounts.entries()) {
        if (now > record.resetAt) {
            ipRequestCounts.delete(ip);
        }
    }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
