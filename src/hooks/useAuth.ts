"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Profile, SubscriptionTier } from "@/types/database";
import { useChatStore } from "@/store/chatStore";

/**
 * useAuth Hook
 * Manages authentication state and provides auth methods
 */

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    error: string | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        session: null,
        isLoading: true,
        error: null,
    });

    const setUserTier = useChatStore((s) => s.setUserTier);
    const supabase = useMemo(() => createClient(), []);

    // Fetch user profile
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                // Log the error for debugging but don't crash
                console.warn("Profile fetch issue (this is OK if profiles table doesn't exist yet):", error?.message || error);

                // Return a default profile so the app can still function
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    return {
                        id: userId,
                        email: user.email || "",
                        subscription_status: "active" as const,
                        subscription_tier: "free" as const,
                        stripe_customer_id: null,
                        stripe_subscription_id: null,
                        subscription_end_date: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as Profile;
                }
                return null;
            }

            return data as Profile;
        } catch (err) {
            console.warn("Profile fetch exception:", err);
            return null;
        }
    }, [supabase]);

    // Initialize auth state
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!isMounted) return;

            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                if (!isMounted) return;
                setState({
                    user: session.user,
                    profile,
                    session,
                    isLoading: false,
                    error: null,
                });
                if (profile) {
                    setUserTier(profile.subscription_tier);
                } else {
                    setUserTier("free");
                }
            } else {
                setState((prev) => ({ ...prev, isLoading: false }));
                setUserTier("free");
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;
                if (session?.user) {
                    const profile = await fetchProfile(session.user.id);
                    if (!isMounted) return;
                    setState({
                        user: session.user,
                        profile,
                        session,
                        isLoading: false,
                        error: null,
                    });
                    if (profile) {
                        setUserTier(profile.subscription_tier);
                    } else {
                        setUserTier("free");
                    }
                } else {
                    if (!isMounted) return;
                    setState({
                        user: null,
                        profile: null,
                        session: null,
                        isLoading: false,
                        error: null,
                    });
                    setUserTier("free");
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile, setUserTier, supabase.auth]);

    // Sign up with email and password
    const signUp = async (email: string, password: string) => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };

    // Sign in with email and password
    const signIn = async (email: string, password: string, remember?: boolean) => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
                return { success: false, error: error.message };
            }

            // Persist a local preference for whether the user wanted the session remembered
            if (typeof window !== "undefined") {
                if (remember) localStorage.setItem("remember", "1");
                else localStorage.removeItem("remember");
            }

            return { success: true, data };
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("signOut failed:", error);
                return { success: false, error: error.message };
            }

            useChatStore.getState().reset();
            return { success: true };
        } catch (err) {
            console.error("signOut threw:", err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    };

    // Reset password
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    };

    return {
        ...state,
        signUp,
        signIn,
        signOut,
        resetPassword,
        isAuthenticated: !!state.user,
        tier: (state.profile?.subscription_tier || "free") as SubscriptionTier,
    };
}

export default useAuth;
