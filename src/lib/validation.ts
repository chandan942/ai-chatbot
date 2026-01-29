import { z, ZodError, ZodIssue } from "zod";

/**
 * Zod Validation Schemas
 * All API inputs must be validated with these schemas
 */

// Common schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();

// AI Model schema
export const aiModelSchema = z.enum([
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
]);

// Subscription tier schema
export const subscriptionTierSchema = z.enum(["free", "pro", "enterprise"]);

// Chat message schema
export const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(32000, "Message too long (max 32,000 characters)"),
});

// Chat request schema (for /api/chat)
export const chatRequestSchema = z.object({
    messages: z
        .array(chatMessageSchema)
        .min(1, "At least one message is required")
        .max(100, "Too many messages"),
    model: aiModelSchema,
    chatId: uuidSchema.optional(),
});

// Create chat schema
export const createChatSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    model: aiModelSchema.optional().default("gpt-3.5-turbo"),
});

// Update chat schema
export const updateChatSchema = z
    .object({
        title: z.string().min(1).max(255).optional(),
        is_archived: z.boolean().optional(),
    })
    .refine((data) => data.title !== undefined || data.is_archived !== undefined, {
        message: "At least one of 'title' or 'is_archived' must be provided",
    });

// Auth schemas
export const signUpSchema = z.object({
    email: emailSchema,
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password too long")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
});

export const signInSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

// Stripe checkout schema
export const checkoutSchema = z.object({
    priceId: z.string().min(1, "Price ID is required"),
});

// Usage query schema
export const usageQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

// Message edit schema
export const editMessageSchema = z.object({
    messageId: uuidSchema,
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(32000, "Message too long"),
});

// Export types inferred from schemas
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateChat = z.infer<typeof createChatSchema>;
export type UpdateChat = z.infer<typeof updateChatSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
export type EditMessage = z.infer<typeof editMessageSchema>;
export type UsageQuery = z.infer<typeof usageQuerySchema>;
export type AIModel = z.infer<typeof aiModelSchema>;
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

/**
 * Validate request body with a schema
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        // result.error is a ZodError
        const zErr = result.error as ZodError<unknown>;
        const errors = zErr.issues.map((e: ZodIssue) => e.message).join(", ");
        throw new Error(`Validation failed: ${errors}`);
    }
    return result.data;
}
