"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { TIERS } from "@/lib/subscription-tiers";
import { cn } from "@/lib/utils";
import { Check, Loader2, Crown, Zap, Rocket, ExternalLink } from "lucide-react";

/**
 * Billing Page
 * Subscription management and upgrade options
 */

export default function BillingPage() {
    const { profile, tier, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Check for success/cancel from Stripe redirect
    useEffect(() => {
        if (searchParams.get("success")) {
            setMessage({ type: "success", text: "Subscription updated successfully!" });
        }
        if (searchParams.get("canceled")) {
            setMessage({ type: "error", text: "Checkout was canceled." });
        }
    }, [searchParams]);

    const handleUpgrade = async (priceId: string) => {
        setIsLoading(priceId);
        setMessage(null);

        try {
            const response = await fetch("/api/stripe/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => response.statusText);
                throw new Error(`Failed to start checkout (status ${response.status}): ${text}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to start checkout",
            });
            setIsLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        setIsLoading("manage");

        try {
            const response = await fetch("/api/stripe/billing-portal", {
                method: "POST",
            });

            if (!response.ok) {
                const text = await response.text().catch(() => response.statusText);
                throw new Error(`Failed to open billing portal (status ${response.status}): ${text}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            window.location.href = data.url;
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? `Failed to open billing portal: ${error.message}` : "Failed to open billing portal",
            });
            setIsLoading(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const tierIcons = {
        free: Zap,
        pro: Crown,
        enterprise: Rocket,
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Unlock powerful AI models and features
                    </p>
                </div>

                {message && (
                    <div
                        className={cn(
                            "mb-8 p-4 rounded-lg text-center",
                            message.type === "success"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}
                    >
                        {message.text}
                    </div>
                )}

                {/* Current Plan */}
                {tier !== "free" && (
                    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                                    {tier} Plan
                                </p>
                            </div>
                            <button
                                onClick={handleManageSubscription}
                                disabled={isLoading === "manage"}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {isLoading === "manage" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="w-4 h-4" />
                                )}
                                Manage Subscription
                            </button>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {(Object.entries(TIERS) as [keyof typeof TIERS, typeof TIERS["free"]][]).map(
                        ([key, tierConfig]) => {
                            const Icon = tierIcons[key];
                            const isCurrentPlan = tier === key;
                            const priceId =
                                key === "pro"
                                    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
                                    : key === "enterprise"
                                        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE
                                        : null;

                            const isConfigured = !!priceId;

                            if (!isConfigured && key !== "free" && process.env.NODE_ENV === "development") {
                                // Provide a clear warning during development that env var is missing
                                console.warn(`Missing NEXT_PUBLIC_STRIPE_PRICE_ID for tier '${key}'. Set NEXT_PUBLIC_STRIPE_PRICE_ID_${key.toUpperCase()} in your .env`);
                            }

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        "relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-8",
                                        isCurrentPlan
                                            ? "border-blue-500 shadow-lg shadow-blue-500/20"
                                            : "border-gray-200 dark:border-gray-700"
                                    )}
                                >
                                    {isCurrentPlan && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                                            Current Plan
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <div
                                            className={cn(
                                                "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4",
                                                key === "free" && "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
                                                key === "pro" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                                                key === "enterprise" && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                            )}
                                        >
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {tierConfig.name}
                                        </h3>
                                        <div className="mt-2">
                                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                                ${tierConfig.price}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">/month</span>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            {tierConfig.messagesPerMonth === -1
                                                ? "Unlimited messages"
                                                : `${tierConfig.messagesPerMonth} messages/month`}
                                        </p>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {tierConfig.models.slice(0, 4).map((model) => (
                                            <li key={model} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                {model}
                                            </li>
                                        ))}
                                        {tierConfig.models.length > 4 && (
                                            <li className="text-sm text-gray-500 dark:text-gray-500">
                                                +{tierConfig.models.length - 4} more models
                                            </li>
                                        )}
                                    </ul>

                                    {isCurrentPlan ? (
                                        <button
                                            disabled
                                            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
                                        >
                                            Current Plan
                                        </button>
                                    ) : key === "free" ? (
                                        <button
                                            disabled
                                            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
                                        >
                                            Free
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => priceId && handleUpgrade(priceId)}
                                            disabled={!!isLoading || !isConfigured}
                                            title={!isConfigured ? "Billing not configured" : undefined}
                                            className={cn(
                                                "w-full py-3 px-4 font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
                                                key === "pro"
                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                                            )}
                                        >
                                            {isLoading === priceId ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : !isConfigured ? (
                                                "Unavailable"
                                            ) : (
                                                "Upgrade"
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        </div>
    );
}
