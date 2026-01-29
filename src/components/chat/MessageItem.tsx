"use client";

import { Message } from "@/types/database";
import { getModelDisplayName } from "@/lib/subscription-tiers";
import { cn, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, RefreshCw, Pencil, User, Bot } from "lucide-react";
import { useState, memo } from "react";

/**
 * MessageItem Component
 * Renders a single chat message with markdown support
 */

interface MessageItemProps {
    message: Message;
    isStreaming?: boolean;
    onEdit?: (id: string, content: string) => void;
    onRegenerate?: (id: string) => void;
}

export const MessageItem = memo(function MessageItem({
    message,
    isStreaming,
    onEdit,
    onRegenerate,
}: MessageItemProps) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === "user";

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy to clipboard", err);
            setCopied(false);
        }
    };

    return (
        <div
            className={cn(
                "flex gap-4 p-4 rounded-xl",
                isUser
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-gray-50 dark:bg-gray-800/50"
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    isUser
                        ? "bg-blue-600 text-white"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                )}
            >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                        {isUser ? "You" : "Assistant"}
                    </span>
                    {message.model && !isUser && (
                        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {getModelDisplayName(message.model)}
                        </span>
                    )}
                    {!isStreaming && (
                        <span className="text-xs text-gray-500">
                            {formatDate(message.created_at)}
                        </span>
                    )}
                    {isStreaming && (
                        <span className="flex items-center gap-1 text-xs text-blue-500">
                            <span className="animate-pulse">●</span>
                            Typing...
                        </span>
                    )}
                </div>

                {/* Message content with Markdown */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                const isInline = !match;

                                if (isInline) {
                                    return (
                                        <code
                                            className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                }

                                return (
                                    <div className="relative group">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(String(children))}
                                            className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <SyntaxHighlighter
                                            style={oneDark}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-lg !mt-0"
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    </div>
                                );
                            },
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                {/* Actions */}
                {!isStreaming && !isUser && (
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                        {onRegenerate && (
                            <button
                                onClick={() => onRegenerate(message.id)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Regenerate
                            </button>
                        )}
                    </div>
                )}

                {/* User message actions */}
                {!isStreaming && isUser && onEdit && (
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={() => onEdit(message.id, message.content)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                    </div>
                )}

                {/* Token usage */}
                {message.tokens_used && (
                    <p className="text-xs text-gray-400">
                        {message.tokens_used.toLocaleString()} tokens
                    </p>
                )}
            </div>
        </div>
    );
});
