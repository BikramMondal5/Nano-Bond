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

        // CRITICAL FIX: Always store wallet as lowercase
        const normalizedWallet = walletAddress.toLowerCase();

        // Check if wallet is already linked to another account
        const existingWallet = await User.findOne({
            walletAddress: normalizedWallet,
            _id: { $ne: session.user.id } // Exclude current user
        });

        if (existingWallet) {
            return NextResponse.json({
                error: "This wallet is already linked to another account"
            }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { walletAddress: normalizedWallet }, // Store as lowercase
            { new: true }
        ).select("-password");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log('Wallet linked successfully:', {
            userId: user._id,
            email: user.email,
            wallet: user.walletAddress
        });

        return NextResponse.json({
            success: true,
            walletAddress: user.walletAddress,
            kycStatus: user.kycStatus || 'NOT_SUBMITTED'
        });
    } catch (error) {
        console.error("Error updating wallet:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}