import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    // Protected routes
    const isProtectedRoute =
        nextUrl.pathname.startsWith("/portfolio") ||
        nextUrl.pathname.startsWith("/invest") ||
        nextUrl.pathname.startsWith("/redeem") ||
        nextUrl.pathname.startsWith("/sponsor") ||
        nextUrl.pathname.startsWith("/verification") ||
        nextUrl.pathname.startsWith("/admin");

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Role-based access control for /admin
    if (nextUrl.pathname.startsWith("/admin") && req.auth?.user?.role !== "Admin") {
        return NextResponse.redirect(new URL("/", nextUrl));
    }
});

export const config = {
    matcher: [
        "/portfolio/:path*",
        "/invest/:path*",
        "/redeem/:path*",
        "/sponsor/:path*",
        "/verification/:path*",
        "/admin/:path*",
    ],
};

// Specify that this middleware should run in Node.js runtime, not Edge
export const runtime = "nodejs";
