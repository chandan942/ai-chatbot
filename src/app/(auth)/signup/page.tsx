"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Lock, Eye, EyeOff, Check, X } from "lucide-react";

/**
 * Sign Up Page
 */
export default function SignUpPage() {
    const router = useRouter();
    const { signUp, isLoading, error } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState("");
    const [success, setSuccess] = useState(false);

    // Password validation
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
    };
    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!email || !password || !confirmPassword) {
            setLocalError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        if (!isPasswordValid) {
            setLocalError("Password does not meet requirements");
            return;
        }

        const result = await signUp(email, password);

        if (result.success) {
            setSuccess(true);
        } else {
            setLocalError(result.error || "Failed to create account");
        }
    };

    const displayError = localError || error;

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400">
                    <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Check your email</h2>
                <p className="text-gray-400">
                    We sent a confirmation link to <strong className="text-white">{email}</strong>
                </p>
                <Link
                    href="/login"
                    className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to login
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Create an account</h2>
                <p className="text-gray-400 mt-1">Start your AI journey today</p>
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

                    {/* Password requirements */}
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        {[
                            { check: passwordChecks.length, label: "8+ characters" },
                            { check: passwordChecks.uppercase, label: "Uppercase letter" },
                            { check: passwordChecks.lowercase, label: "Lowercase letter" },
                            { check: passwordChecks.number, label: "Number" },
                        ].map(({ check, label }) => (
                            <div
                                key={label}
                                className={`flex items-center gap-1 ${check ? "text-green-400" : "text-gray-500"
                                    }`}
                            >
                                {check ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        "Create account"
                    )}
                </button>
            </form>

            <div className="text-center text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                    Sign in
                </Link>
            </div>
        </div>
    );
}
