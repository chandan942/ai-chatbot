/**
 * Logger Utility
 * Structured logging for the application
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Get minimum log level from environment
const MIN_LOG_LEVEL = (process.env.NODE_ENV === "production" ? "info" : "debug") as LogLevel;

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

import util from "util";

function safeStringify(obj: unknown) {
    try {
        return JSON.stringify(obj);
    } catch (err) {
        return util.inspect(obj, { depth: 3 });
    }
}

function formatLog(entry: LogEntry): string {
    const contextStr = entry.context
        ? ` | ${safeStringify(entry.context)}`
        : "";
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

function createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
): LogEntry {
    return {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
    };
}

export const logger = {
    debug(message: string, context?: Record<string, unknown>) {
        if (!shouldLog("debug")) return;
        const entry = createLogEntry("debug", message, context);
        console.debug(formatLog(entry));
    },

    info(message: string, context?: Record<string, unknown>) {
        if (!shouldLog("info")) return;
        const entry = createLogEntry("info", message, context);
        console.info(formatLog(entry));
    },

    warn(message: string, context?: Record<string, unknown>) {
        if (!shouldLog("warn")) return;
        const entry = createLogEntry("warn", message, context);
        console.warn(formatLog(entry));
    },

    error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
        if (!shouldLog("error")) return;
        const errorContext = error instanceof Error
            ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
            : { error };
        const entry = createLogEntry("error", message, { ...errorContext, ...context });
        console.error(formatLog(entry));
    },

    // Log API requests
    api(method: string, path: string, status: number, durationMs: number) {
        const sanitized = sanitizePath(path);
        this.info(`${method} ${sanitized} ${status}`, { durationMs });
    },

    // Helper to sanitize paths (drop query string values)
    // Note: Keeps path and query keys but removes values to avoid logging tokens/ids
    helper_sanitizePath: undefined as unknown as (p: string) => string,

    // Log authentication events
    auth(event: "login" | "logout" | "signup" | "error", userId?: string) {
        const id = anonymizeUserId(userId);
        this.info(`Auth: ${event}`, { userId: id });
    },

    // Log payment events
    payment(event: string, userId: string, amount?: number) {
        const id = anonymizeUserId(userId);
        this.info(`Payment: ${event}`, { userId: id, amount });
    },

    // Log AI chat events
    chat(event: string, userId: string, model?: string, tokens?: number) {
        const id = anonymizeUserId(userId);
        this.info(`Chat: ${event}`, { userId: id, model, tokens });
    },
};

function sanitizePath(path: string) {
    try {
        const url = new URL(path, "http://example.invalid");
        const keys = Array.from(url.searchParams.keys());
        const sanitizedQuery = keys.length ? keys.map((k) => `${k}=REDACTED`).join("&") : "";
        return url.pathname + (sanitizedQuery ? `?${sanitizedQuery}` : "");
    } catch (err) {
        const idx = path.indexOf("?");
        if (idx === -1) return path;
        return path.slice(0, idx) + "?REDACTED";
    }
}

function anonymizeUserId(userId?: string) {
    if (!userId) return undefined;
    try {
        const suffix = userId.slice(-6);
        return `user_${suffix}`;
    } catch {
        return undefined;
    }
}

export { sanitizePath, anonymizeUserId };

export default logger;
