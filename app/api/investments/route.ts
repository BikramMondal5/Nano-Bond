import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Investment } from "@/lib/models/Investment";

/**
 * GET /api/investments?address=0x...
 * Fetches transaction history for a specific wallet address
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get("address");

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Wallet address is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Fetch recent investments, sorted by newest first
        const investments = await Investment.find({ walletAddress: address })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({
            success: true,
            data: investments
        });
    } catch (error: any) {
        console.error("[API] Failed to fetch investments:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
