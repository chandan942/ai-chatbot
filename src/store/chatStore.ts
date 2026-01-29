import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chat, Message, AIModel, SubscriptionTier } from "@/types/database";

/**
 * Zustand Store for Chat State Management
 * Handles chats, messages, streaming state, and user preferences
 */

interface ChatStore {
    // State
    chats: Chat[];
    currentChat: Chat | null;
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    streamingContent: string;
    error: string | null;
    selectedModel: AIModel;
    userTier: SubscriptionTier;

    // Actions
    setChats: (chats: Chat[]) => void;
    setCurrentChat: (chat: Chat | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessage: (id: string, content: string) => void;
    removeMessage: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setStreaming: (streaming: boolean) => void;
    appendStreamContent: (content: string) => void;
    resetStreamContent: () => void;
    setError: (error: string | null) => void;
    setSelectedModel: (model: AIModel) => void;
    setUserTier: (tier: SubscriptionTier) => void;

    // Complex actions
    createChat: (title: string, model: AIModel) => Chat;
    deleteChat: (id: string) => void;
    archiveChat: (id: string) => void;
    clearError: () => void;
    reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            // Initial state
            chats: [],
            currentChat: null,
            messages: [],
            isLoading: false,
            isStreaming: false,
            streamingContent: "",
            error: null,
            selectedModel: "gpt-3.5-turbo",
            userTier: "free",

            // Simple setters
            setChats: (chats) => set({ chats }),
            setCurrentChat: (currentChat) => set({ currentChat, messages: [] }),
            setMessages: (messages) => set({ messages }),

            addMessage: (message) =>
                set((state) => ({
                    messages: [...state.messages, message],
                })),

            updateMessage: (id, content) =>
                set((state) => ({
                    messages: state.messages.map((m) =>
                        m.id === id ? { ...m, content } : m
                    ),
                })),

            removeMessage: (id) =>
                set((state) => ({
                    messages: state.messages.filter((m) => m.id !== id),
                })),

            setLoading: (isLoading) => set({ isLoading }),
            setStreaming: (isStreaming) => set({ isStreaming }),

            appendStreamContent: (content) =>
                set((state) => ({
                    streamingContent: state.streamingContent + content,
                })),

            resetStreamContent: () => set({ streamingContent: "" }),
            setError: (error) => set({ error }),
            setSelectedModel: (selectedModel) => set({ selectedModel }),
            setUserTier: (userTier) => set({ userTier }),

            // Complex actions
            createChat: (title, model) => {
                const newChat: Chat = {
                    id: generateId(),
                    user_id: "", // Will be set when syncing with server
                    title: title || "New Chat",
                    model_used: model,
                    is_archived: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                set((state) => ({
                    chats: [newChat, ...state.chats],
                    currentChat: newChat,
                    messages: [],
                }));
                return newChat;
            },

            deleteChat: (id) =>
                set((state) => ({
                    chats: state.chats.filter((c) => c.id !== id),
                    currentChat:
                        state.currentChat?.id === id ? null : state.currentChat,
                    messages:
                        state.currentChat?.id === id ? [] : state.messages,
                })),

            archiveChat: (id) =>
                set((state) => ({
                    chats: state.chats.map((c) =>
                        c.id === id ? { ...c, is_archived: true } : c
                    ),
                })),

            clearError: () => set({ error: null }),

            reset: () =>
                set({
                    chats: [],
                    currentChat: null,
                    messages: [],
                    isLoading: false,
                    isStreaming: false,
                    streamingContent: "",
                    error: null,
                }),
        }),
        {
            name: "chat-storage",
            partialize: (state) => ({
                // Only persist these fields
                chats: state.chats.slice(0, 10), // Last 10 chats
                selectedModel: state.selectedModel,
                userTier: state.userTier,
            }),
        }
    )
);

export default useChatStore;
