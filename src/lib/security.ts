/**
 * Security Utilities
 * - Input sanitization (XSS prevention)
 * - CSRF token generation and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeInput(input: string): string {
    const htmlEntities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
    };

    return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize chat message content
 * More lenient than full HTML sanitization to allow markdown
 */
export function sanitizeChatMessage(message: string): string {
    // Remove potentially dangerous patterns
    let sanitized = message;

    // Remove script tags and event handlers
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/data:/gi, "");

    // Remove other potentially dangerous HTML
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
    sanitized = sanitized.replace(/<embed\b[^>]*>/gi, "");
    sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");

    return sanitized.trim();
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
    if (!token || !storedToken) return false;
    if (token.length !== storedToken.length) return false;

    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Validate Stripe webhook signature
 */
export function validateStripeWebhook(
    payload: string,
    signature: string,
    webhookSecret: string
): boolean {
    // This will be handled by Stripe SDK in the webhook route
    // This is a placeholder for the interface
    return true;
}

/**
 * Check if a string looks like a potential injection attempt
 */
export function detectInjectionAttempt(input: string): boolean {
    const injectionPatterns = [
        // SQL injection patterns
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
        /(--)|(\/\*)|(\*\/)/,
        // XSS patterns
        /<script/i,
        /javascript:/i,
        /on(click|load|error|mouseover)/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limit key generator for consistent key creation
 */
export function getRateLimitKey(type: "ip" | "user", identifier: string): string {
    return `ratelimit:${type}:${identifier}`;
}
