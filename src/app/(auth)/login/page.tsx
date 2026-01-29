"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

/**
 * Login Page
 */
import { Suspense } from "react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawRedirect = searchParams.get("redirect") || "/chat";

    const sanitizeRedirect = (value: string) => {
        try {
            const url = new URL(value, window.location.origin);
            if (url.origin === window.location.origin && url.pathname.startsWith("/")) {
                return url.pathname + url.search + url.hash;
            }
        } catch (err) {
            // fallthrough
        }
        return "/chat";
    };

    const redirect = typeof window !== "undefined" ? sanitizeRedirect(rawRedirect) : "/chat";

    const { signIn, isLoading, error } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState("");
    const [remember, setRemember] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!email || !password) {
            setLocalError("Please fill in all fields");
            return;
        }

        const result = await signIn(email, password, remember);

        if (result.success) {
            router.push(redirect);
        } else {
            setLocalError(result.error || "Failed to sign in");
        }
    };

    const displayError = localError || error;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="text-gray-400 mt-1">Sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {displayError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {displayError}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-400">
                        <input
                            type="checkbox"
                            className="mr-2 rounded border-gray-600 bg-gray-700"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        Remember me
                    </label>
                    <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </button>
            </form>

            <div className="text-center text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                    Sign up
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
