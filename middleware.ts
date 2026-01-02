import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export { auth as middleware } from "@/lib/auth";

export const config = {
    matcher: [
        "/portfolio/:path*",
        "/invest/:path*",
        "/redeem/:path*",
        "/sponsor/:path*",
        "/verification/:path*",
    ],
};

// Specify that this middleware should run in Node.js runtime, not Edge
export const runtime = "nodejs";
