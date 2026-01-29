// Next.js 16 proxy: single entry for edge (replaces middleware.ts)
import type { NextRequest } from "next/server";
import { middleware } from "./middleware-handler";

export async function proxy(request: NextRequest) {
    return middleware(request);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};
