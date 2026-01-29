import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers, and Server Actions
 * Handles cookie management for session persistence
 */
export async function createClient() {
    const cookieStore = await cookies();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables");
    }

    return createServerClient(url, anon, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch (err) {
                    // In some server component contexts cookies are read-only; swallow to avoid crashing
                    // and let callers handle the absence of cookie mutation capabilities.
                    console.warn("cookieStore.set failed (read-only environment)", err);
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: "", ...options });
                } catch (err) {
                    console.warn("cookieStore.remove failed (read-only environment)", err);
                }
            },
        },
    });
}

/**
 * Creates a Supabase admin client with service role key
 * WARNING: Only use server-side, never expose to client
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !roleKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    }

    return createServerClient(url, roleKey, {
        cookies: {
            get: () => undefined,
            set: () => { },
            remove: () => { },
        },
    });
}
