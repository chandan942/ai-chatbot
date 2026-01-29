"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMessageLimit, isUnlimited, getUsagePercentage, isNearLimit } from "@/lib/subscription-tiers";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, TrendingUp, Zap, MessageSquare, Coins } from "lucide-react";

/**
 * Usage Dashboard Page
 * Shows message usage, token consumption, and quota status
 */

interface UsageData {
    messagesUsed: number;
    tokensUsed: number;
    periodStart: string;
    periodEnd: string;
}

export default function UsagePage() {
    const { tier, isLoading: authLoading } = useAuth();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUsage() {
            try {
                const response = await fetch("/api/usage");
                if (response.ok) {
                    const data = await response.json();
                    setUsage(data);
                }
            } catch (error) {
                console.error("Failed to fetch usage:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUsage();
    }, []);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const messageLimit = getMessageLimit(tier);
    const messagesUsed = usage?.messagesUsed || 0;
    const tokensUsed = usage?.tokensUsed || 0;
    const usagePercent = getUsagePercentage(messagesUsed, messageLimit);
    const nearLimit = isNearLimit(messagesUsed, messageLimit);
    const unlimited = isUnlimited(tier);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Usage Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track your AI usage and quota
                    </p>
                </div>

                {/* Alert for near limit */}
                {nearLimit && !unlimited && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                You&apos;re approaching your message limit
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                You&apos;ve used {usagePercent}% of your monthly quota.{" "}
                                <a href="/billing" className="underline hover:no-underline">
                                    Upgrade your plan
                                </a>{" "}
                                for more messages.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid sm:grid-cols-3 gap-6 mb-8">
                    {/* Messages Used */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Messages Used
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {messagesUsed.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {unlimited
                                ? "Unlimited"
                                : `of ${messageLimit.toLocaleString()} this month`}
                        </p>
                    </div>

                    {/* Tokens Used */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Tokens Used
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {tokensUsed.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            This billing period
                        </p>
                    </div>

                    {/* Current Plan */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Current Plan
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
                            {tier}
                        </div>
                        <a
                            href="/billing"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                        >
                            Manage plan →
                        </a>
                    </div>
                </div>

                {/* Progress Bar */}
                {!unlimited && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Monthly Usage
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {usagePercent}% used
                            </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500",
                                    usagePercent < 50
                                        ? "bg-green-500"
                                        : usagePercent < 80
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                )}
                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{messagesUsed} messages</span>
                            <span>{messageLimit} limit</span>
                        </div>
                    </div>
                )}

                {/* Billing Period */}
                {usage && (
                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Billing period:{" "}
                        {new Date(usage.periodStart).toLocaleDateString()} -{" "}
                        {new Date(usage.periodEnd).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );
}
