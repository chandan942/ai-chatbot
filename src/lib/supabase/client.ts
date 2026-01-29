import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in the browser (Client Components)
 * Uses environment variables for configuration
 */
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables");
    }

    return createBrowserClient(url, anon);
}
