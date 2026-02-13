import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Auth & security handler (used by proxy)
 * - Handles authentication state
 * - Protects dashboard routes
 * - Refreshes auth tokens
 */

const protectedRoutes = ["/chat", "/history", "/usage", "/settings", "/billing"];
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Only run Supabase auth check on routes that actually need it
    const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // For non-protected, non-auth routes (like "/"), skip Supabase entirely
    if (!needsAuth && !isAuthRoute) {
        const response = NextResponse.next();
        setSecurityHeaders(response);
        return response;
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    let user = null;

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: "",
                            ...options,
                        });
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        response.cookies.set({
                            name,
                            value: "",
                            ...options,
                        });
                    },
                },
            }
        );

        // Timeout wrapper — don't let Supabase hang the middleware
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (result && "data" in result) {
            user = result.data?.user ?? null;
        }
    } catch (err) {
        console.warn("Middleware: Supabase auth check failed, allowing request through");
    }

    // Redirect unauthenticated users away from protected routes
    if (needsAuth && !user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL("/chat", request.url));
    }

    setSecurityHeaders(response);
    return response;
}

function setSecurityHeaders(response: NextResponse) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );
}
