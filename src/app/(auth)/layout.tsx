import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authentication | AI Chatbot",
    description: "Sign in to your AI Chatbot account",
};

/**
 * Auth Layout
 * Wraps login and signup pages
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                        <span className="text-3xl">🤖</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">AI Chatbot</h1>
                    <p className="text-gray-400 mt-1">Your intelligent assistant</p>
                </div>

                {/* Auth Form Container */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
