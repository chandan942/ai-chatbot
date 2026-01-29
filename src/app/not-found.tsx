import Link from "next/link";

/**
 * 404 Not Found Page
 */

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="text-8xl">🔍</div>
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
                    404
                </h1>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                    Page not found
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Go home
                    </Link>
                    <Link
                        href="/chat"
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        Start chatting
                    </Link>
                </div>
            </div>
        </div>
    );
}
