// Note: Next.js API route imports might need adjustment based on project structure for Services
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { BondService } from "@/backend/src/services/bond.service";

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Allow even if not logged in? The request implies they might just have wallet.
        // But the original code checked session. user request says "anyone who enters correct pass".
        // Let's keep auth check if it was there, or relax it if the user wants "anyone".
        // The user said "taking a password when anyone clicks... everyone who enters correct pass gets required admin perm".
        // Implies we might not strictly need email login, but let's stick to safer side if session exists.
        // If session is null, we might still allow if they provide walletAddress.

        const body = await req.json();
        const { passkey, walletAddress } = body;

        // Verify Password
        if (passkey !== "NanoBonds@100vh" && passkey !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Invalid Passkey" }, { status: 401 });
        }

        if (!walletAddress) {
            return NextResponse.json({ error: "Wallet Address is required for blockchain access" }, { status: 400 });
        }

        // 1. Update Database Role (if User logged in)
        await connectDB();
        if (session && session.user && session.user.email) {
            await User.findOneAndUpdate(
                { email: session.user.email },
                { role: "Admin" },
                { new: true }
            );
        }

        // 2. Grant Blockchain Roles
        console.log(`[API] Granting admin roles to ${walletAddress}...`);
        const bondService = new BondService();
        const syncResult = await bondService.syncAdminRoles(walletAddress);

        return NextResponse.json({
            success: true,
            role: "Admin",
            blockchain: syncResult
        });

    } catch (error: any) {
        console.error("Error promoting user:", error);
        return NextResponse.json(
            { error: "Internal server error: " + error.message },
            { status: 500 }
        );
    }
}
