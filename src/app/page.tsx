import Link from "next/link";
import { MessageSquare, Sparkles, Zap, Shield, Globe, ArrowRight } from "lucide-react";

/**
 * Landing Page
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AI Chatbot</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            Powered by GPT-4, Claude 3 & Gemini
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Your Intelligent{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Assistant
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Experience the future of AI conversation with access to the world&apos;s most advanced language models in one beautiful interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
            >
              Start Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose AI Chatbot?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Multiple AI Models",
                description:
                  "Access GPT-4, Claude 3, and Gemini Pro all in one place. Switch models instantly based on your needs.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Real-time streaming responses with optimized performance. Get answers as they're generated.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description:
                  "Your conversations are encrypted and never used for training. Enterprise-grade security.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of users already using AI Chatbot
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} AI Chatbot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
