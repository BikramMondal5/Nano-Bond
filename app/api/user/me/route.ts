import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id).select("-password");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                walletAddress: user.walletAddress,
                portfolio: user.portfolio,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
