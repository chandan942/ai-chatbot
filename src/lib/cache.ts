/**
 * Caching Utilities
 * localStorage-based caching for client-side data
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const CACHE_PREFIX = "ai_chatbot_cache_";

/**
 * Set a value in cache with expiration
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
    if (typeof window === "undefined") return;

    const entry: CacheEntry<T> = {
        data,
        expiresAt: Date.now() + ttlMs,
    };

    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
        console.warn("Failed to set cache:", error);
        // If localStorage is full, clear old entries
        clearExpiredCache();
    }
}

/**
 * Get a value from cache
 * Returns null if expired or not found
 */
export function getCache<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Remove a specific cache entry
 */
export function removeCache(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(): void {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(CACHE_PREFIX)) continue;

        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const entry: CacheEntry<unknown> = JSON.parse(raw);
            if (now > entry.expiresAt) {
                keysToRemove.push(key);
            }
        } catch {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    if (typeof window === "undefined") return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Cache TTL constants
export const CACHE_TTL = {
    SHORT: 1 * 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
    HOUR: 60 * 60 * 1000, // 1 hour
    DAY: 24 * 60 * 60 * 1000, // 1 day
};

// Specific cache keys
export const CACHE_KEYS = {
    USER_PROFILE: "user_profile",
    SUBSCRIPTION_STATUS: "subscription_status",
    USAGE_STATS: "usage_stats",
    RECENT_CHATS: "recent_chats",
};
