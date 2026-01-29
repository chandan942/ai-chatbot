"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Global Error Page
 * Displayed when an error occurs in the application
 */

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="text-8xl">💥</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Oops! Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>
                {error.digest && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Error ID: {error.digest}
                    </p>
                )}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
