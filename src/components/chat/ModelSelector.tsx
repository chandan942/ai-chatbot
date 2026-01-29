"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { AIModel } from "@/types/database";
import { getModelDisplayName, canAccessModel, TIERS } from "@/lib/subscription-tiers";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Lock, Sparkles } from "lucide-react";

/**
 * Model Selector Component
 * Dropdown for selecting AI model based on subscription tier
 */

const ALL_MODELS: AIModel[] = [
    // OpenAI
    "gpt-3.5-turbo",
    "gpt-4",
    "gpt-4-turbo",
    "gpt-4o",
    // Anthropic
    "claude-3-haiku-20240307",
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229",
    "claude-3-5-sonnet-20241022",
    // Google
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
];

const MODEL_GROUPS = {
    OpenAI: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"] as AIModel[],
    Anthropic: [
        "claude-3-haiku-20240307",
        "claude-3-sonnet-20240229",
        "claude-3-opus-20240229",
        "claude-3-5-sonnet-20241022",
    ] as AIModel[],
    Google: ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"] as AIModel[],
};

export function ModelSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { selectedModel, setSelectedModel, userTier } = useChatStore();
    const { tier } = useAuth();

    const effectiveTier = tier || userTier;

    const handleSelect = (model: AIModel) => {
        if (canAccessModel(effectiveTier, model)) {
            setSelectedModel(model);
            setIsOpen(false);
        }
    };

    // Close on Escape when open
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen]);

    const dropdownId = "model-selector-dropdown";

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={dropdownId}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getModelDisplayName(selectedModel)}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-gray-500 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div id={dropdownId} role="listbox" aria-label="Select model" className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-2 max-h-96 overflow-y-auto">
                        {Object.entries(MODEL_GROUPS).map(([group, models]) => (
                            <div key={group}>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {group}
                                </div>
                                {models.map((model) => {
                                    const hasAccess = canAccessModel(effectiveTier, model);
                                    const isSelected = selectedModel === model;

                                    return (
                                        <button
                                            key={model}
                                            onClick={() => handleSelect(model)}
                                            disabled={!hasAccess}
                                            role="option"
                                            aria-selected={isSelected}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
                                                hasAccess
                                                    ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    : "opacity-50 cursor-not-allowed",
                                                isSelected && "bg-blue-50 dark:bg-blue-900/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "text-sm",
                                                        hasAccess
                                                            ? "text-gray-900 dark:text-white"
                                                            : "text-gray-500"
                                                    )}
                                                >
                                                    {getModelDisplayName(model)}
                                                </span>
                                            </div>
                                            {isSelected && hasAccess && (
                                                <Check className="w-4 h-4 text-blue-500" />
                                            )}
                                            {!hasAccess && (
                                                <div className="flex items-center gap-1 text-xs text-amber-500">
                                                    <Lock className="w-3 h-3" />
                                                    Upgrade
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Upgrade prompt for free users */}
                        {effectiveTier === "free" && (
                            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                                <a
                                    href="/billing"
                                    className="block w-full text-center py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                                >
                                    Upgrade for more models
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
