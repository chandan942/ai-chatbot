import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { checkMessageQuota } from "./rate-limiter";

// Mock date to ensure consistent testing
const MOCK_DATE = new Date("2024-01-15T12:00:00Z").getTime();

describe("Rate Limiter", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_DATE);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe("checkMessageQuota", () => {
        it("should allow request when under limit", () => {
            const result = checkMessageQuota("free", 5);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeGreaterThan(0);
        });

        it("should block request when over limit", () => {
            // Free tier limit is 50
            const result = checkMessageQuota("free", 50);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.error).toBeDefined();
        });

        it("should always allow unlimited tier", () => {
            const result = checkMessageQuota("enterprise", 1000);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(-1);
        });
    });
});
