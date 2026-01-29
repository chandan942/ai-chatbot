import { validateRequest, chatRequestSchema } from "./validation";
import { ZodError } from "zod";

describe("Validation", () => {
    describe("validateRequest", () => {
        it("should return data when validation succeeds", () => {
            const validData = {
                messages: [{ role: "user", content: "Hello" }],
                model: "gpt-4",
            };
            const result = validateRequest(chatRequestSchema, validData);
            expect(result).toEqual(validData);
        });

        it("should throw error when validation fails", () => {
            const invalidData = {
                messages: [], // Empty messages array not allowed by most schemas usually, or invalid structure
                model: 123, // Invalid model type
            };

            expect(() => {
                validateRequest(chatRequestSchema, invalidData);
            }).toThrow("Validation failed");
        });
    });

    describe("chatRequestSchema", () => {
        it("should validate correct structure", () => {
            const result = chatRequestSchema.safeParse({
                messages: [{ role: "user", content: "Hi" }],
                model: "gpt-3.5-turbo",
            });
            expect(result.success).toBe(true);
        });

        it("should reject missing required fields", () => {
            const result = chatRequestSchema.safeParse({
                model: "gpt-3.5-turbo",
            });
            expect(result.success).toBe(false);
        });
    });
});
