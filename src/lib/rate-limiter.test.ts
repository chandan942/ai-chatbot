import { checkMessageQuota } from "./rate-limiter";

// Mock date to ensure consistent testing
const MOCK_DATE = new Date("2024-01-15T12:00:00Z").getTime();
const ORIGINAL_DATE = Date;

describe("Rate Limiter", () => {
    beforeEach(() => {
        global.Date.now = jest.fn(() => MOCK_DATE);
    });

    afterEach(() => {
        global.Date = ORIGINAL_DATE;
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
