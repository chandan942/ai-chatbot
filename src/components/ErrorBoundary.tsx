"use client";

import React from "react";

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to console in development
        console.error("Error caught by boundary:", error, errorInfo);

        // Log to Sentry in production
        if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
            // Sentry.captureException(error, { extra: errorInfo });
        }
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback or default error UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                        <div className="text-6xl">😓</div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Functional wrapper for easier use with hooks
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
