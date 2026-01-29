"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { Message, AIModel } from "@/types/database";
import { getModelDisplayName } from "@/lib/subscription-tiers";
import { cn, generateId } from "@/lib/utils";
import {
    Send,
    Loader2,
    Plus,
    MessageSquare,
    ChevronDown,
    Settings,
    LogOut,
    CreditCard,
    BarChart3,
    Menu,
    X,
} from "lucide-react";
import { MessageItem } from "@/components/chat/MessageItem";
import { ModelSelector } from "@/components/chat/ModelSelector";

/**
 * Main Chat Page
 */
export default function ChatPage() {
    const { user, profile, signOut, tier } = useAuth();
    const {
        chats,
        currentChat,
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        selectedModel,
        setCurrentChat,
        createChat,
        addMessage,
        setLoading,
        setStreaming,
        appendStreamContent,
        resetStreamContent,
        setError,
    } = useChatStore();

    const [input, setInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    // Handle send message
    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading || isStreaming) return;

        const userMessage: Message = {
            id: generateId(),
            chat_id: "",
            role: "user",
            content: input.trim(),
            tokens_used: null,
            model: null,
            metadata: null,
            created_at: new Date().toISOString(),
        };

        // Create new chat if none exists
        let chatId = currentChat?.id;
        if (!chatId) {
            const newChat = createChat(input.slice(0, 50), selectedModel);
            chatId = newChat.id;
        }

        // Ensure the user message has the resolved chat id
        userMessage.chat_id = chatId;
        addMessage(userMessage);
        setInput("");
        setLoading(true);
        setStreaming(true);
        resetStreamContent();

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: userMessage.content }].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    model: selectedModel,
                    chatId,
                }),
            });

            if (!response.ok) {
                // Try to parse JSON error, fallback to text
                let parsedError: string | null = null;
                try {
                    const json = await response.json();
                    parsedError = json?.error || JSON.stringify(json);
                } catch (err) {
                    try {
                        parsedError = await response.text();
                    } catch {
                        parsedError = response.statusText;
                    }
                }
                throw new Error(`Failed to send message (status ${response.status}): ${parsedError}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response stream");

            const decoder = new TextDecoder();
            let assistantContent = "";
            let streamBuffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                streamBuffer += decoder.decode(value, { stream: true });
                const lines = streamBuffer.split("\n");

                // Keep the last partial line in the buffer
                streamBuffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith("data: ")) continue;

                    let parsed: any = null;
                    try {
                        parsed = JSON.parse(trimmedLine.slice(6));
                    } catch (err) {
                        // Ignore malformed JSON but keep streaming
                        console.warn("Malformed SSE JSON chunk, skipping", err);
                        continue;
                    }

                    const data = parsed;

                    if (data?.token) {
                        assistantContent += data.token;
                        appendStreamContent(data.token);
                    }

                    if (data?.done) {
                        // Add assistant message
                        const assistantMessage: Message = {
                            id: generateId(),
                            chat_id: chatId,
                            role: "assistant",
                            content: assistantContent,
                            tokens_used: data.usage?.total_tokens || null,
                            model: selectedModel,
                            metadata: null,
                            created_at: new Date().toISOString(),
                        };
                        addMessage(assistantMessage);
                    }

                    if (data?.error) {
                        throw new Error(data.error);
                    }
                }
            }

            // Process any remaining buffered data after stream end
            if (streamBuffer.trim()) {
                const trailingLines = streamBuffer.split("\n");
                for (const tline of trailingLines) {
                    const trimmedLine = tline.trim();
                    if (!trimmedLine.startsWith("data: ")) continue;

                    try {
                        const parsed = JSON.parse(trimmedLine.slice(6));
                        const data = parsed;

                        if (data?.token) {
                            assistantContent += data.token;
                            appendStreamContent(data.token);
                        }

                        if (data?.done) {
                            const assistantMessage: Message = {
                                id: generateId(),
                                chat_id: chatId,
                                role: "assistant",
                                content: assistantContent,
                                tokens_used: data.usage?.total_tokens || null,
                                model: selectedModel,
                                metadata: null,
                                created_at: new Date().toISOString(),
                            };
                            addMessage(assistantMessage);
                        }

                        if (data?.error) {
                            throw new Error(data.error);
                        }
                    } catch (err) {
                        console.warn("Malformed trailing SSE JSON chunk, skipping", err);
                        // continue processing any other trailing lines
                    }
                }

                // Clear the buffer
                streamBuffer = "";
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to send message");
        } finally {
            setLoading(false);
            setStreaming(false);
            resetStreamContent();
        }
    }, [
        input, isLoading, isStreaming, currentChat, messages, selectedModel,
        addMessage, createChat, setLoading, setStreaming, appendStreamContent,
        resetStreamContent, setError,
    ]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside
                className={cn(
                    "w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full absolute lg:relative lg:translate-x-0"
                )}
            >
                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={() => setCurrentChat(null)}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Chat
                    </button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {chats.filter((c) => !c.is_archived).map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => setCurrentChat(chat)}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                                currentChat?.id === chat.id
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{chat.title}</span>
                        </button>
                    ))}
                </div>

                {/* User Menu */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {((user?.email?.charAt(0) ?? "") || "U").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            <p className="text-xs text-gray-400 capitalize">{tier} Plan</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <a href="/usage" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <BarChart3 className="w-4 h-4" />
                            Usage
                        </a>
                        <a href="/billing" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <CreditCard className="w-4 h-4" />
                            Billing
                        </a>
                        <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            Settings
                        </a>
                        <button
                            onClick={signOut}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currentChat?.title || "New Chat"}
                        </h1>
                    </div>
                    <ModelSelector />
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && !isStreaming && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-4 max-w-md">
                                <div className="text-6xl">🤖</div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    How can I help you today?
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Start a conversation with any of our AI models
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <MessageItem key={message.id} message={message} />
                    ))}

                    {/* Streaming message */}
                    {isStreaming && streamingContent && (
                        <MessageItem
                            message={{
                                id: "streaming",
                                chat_id: "",
                                role: "assistant",
                                content: streamingContent,
                                tokens_used: null,
                                model: selectedModel,
                                metadata: null,
                                created_at: new Date().toISOString(),
                            }}
                            isStreaming
                        />
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                rows={1}
                                className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading || isStreaming}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading || isStreaming}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading || isStreaming ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Using {getModelDisplayName(selectedModel)}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
