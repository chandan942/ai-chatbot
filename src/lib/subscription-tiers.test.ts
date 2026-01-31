import { describe, it, expect } from '@jest/globals';
import {
    getSubscriptionLimits,
    isUnlimited,
    canAccessModel,
    TIERS,
} from "./subscription-tiers";

describe("Subscription Tiers", () => {
    describe("getSubscriptionLimits", () => {
        it("should return correct limits for free tier", () => {
            const limits = getSubscriptionLimits("free");
            expect(limits).toEqual(TIERS.free);
        });

        it("should return correct limits for pro tier", () => {
            const limits = getSubscriptionLimits("pro");
            expect(limits).toEqual(TIERS.pro);
        });

        it("should return free tier limits for unknown tier", () => {
            const limits = getSubscriptionLimits("unknown");
            expect(limits).toEqual(TIERS.free);
        });
    });

    describe("isUnlimited", () => {
        it("should return true for unlimited tier", () => {
            expect(isUnlimited("enterprise")).toBe(true);
        });

        it("should return false for limited tiers", () => {
            expect(isUnlimited("free")).toBe(false);
            expect(isUnlimited("pro")).toBe(false);
        });
    });

    describe("canAccessModel", () => {
        it("should allow free models for free tier", () => {
            expect(canAccessModel("free", "gemini-pro")).toBe(true);
        });

        it("should deny premium models for free tier", () => {
            expect(canAccessModel("free", "gpt-4")).toBe(false);
            expect(canAccessModel("free", "claude-3-opus-20240229")).toBe(false);
        });

        it("should allow premium models for pro tier", () => {
            expect(canAccessModel("pro", "gpt-4")).toBe(true);
            expect(canAccessModel("pro", "claude-3-opus-20240229")).toBe(false);
        });
    });
});
