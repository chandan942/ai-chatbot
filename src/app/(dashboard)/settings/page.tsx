"use client";

import { useAuth } from "@/hooks/useAuth";
import { Loader2, User, CreditCard, BarChart3, Mail, Shield } from "lucide-react";
import Link from "next/link";

/**
 * Settings Page
 * Account overview and quick links to usage and billing
 */
export default function SettingsPage() {
    const { user, profile, tier, isLoading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your account and preferences
                    </p>
                </div>

                {/* Account info */}
                <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Account
                    </h2>
                    <dl className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <div>
                                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</dt>
                                <dd className="text-gray-900 dark:text-white font-medium">{user?.email ?? "—"}</dd>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <div>
                                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plan</dt>
                                <dd className="text-gray-900 dark:text-white font-medium capitalize">{tier ?? "—"}</dd>
                            </div>
                        </div>
                    </dl>
                </section>

                {/* Quick links */}
                <section className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Quick links
                    </h2>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href="/usage"
                                className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                <span>Usage & quota</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/billing"
                                className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <CreditCard className="w-5 h-5 text-blue-500" />
                                <span>Billing & subscription</span>
                            </Link>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
