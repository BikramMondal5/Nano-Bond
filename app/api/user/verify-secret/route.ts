
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Assuming standard NextAuth session retrieval
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { secretKey } = await req.json();

        if (!secretKey) {
            return NextResponse.json({ error: "Secret key is required" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has a secretKey set
        if (user.secretKey) {
            // Compare input with hashed secretKey
            const isValid = await bcrypt.compare(secretKey, user.secretKey);

            if (isValid) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ success: false, error: "Invalid Secret Key" }, { status: 403 });
            }
        } else {
            // Fallback if no secret key (legacy users?), assuming invalid
            return NextResponse.json({ success: false, error: "No Secret Key set for this account" }, { status: 403 });
        }

    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
