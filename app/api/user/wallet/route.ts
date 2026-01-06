import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { walletAddress } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { walletAddress },
            { new: true }
        ).select("-password");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            walletAddress: user.walletAddress,
        });
    } catch (error) {
        console.error("Error updating wallet:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}