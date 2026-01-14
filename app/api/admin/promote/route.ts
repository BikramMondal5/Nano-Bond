
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { passkey } = await req.json();

        if (passkey !== "NanoBonds@100vh") {
            return NextResponse.json({ error: "Invalid Passkey" }, { status: 401 });
        }

        await connectDB();

        // Convert string id to ObjectId if necessary, or let Mongoose handle it
        // session.user.id typically comes as string from next-auth
        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email }, // Safer to look up by email which is unique
            { role: "Admin" },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, role: updatedUser.role });

    } catch (error) {
        console.error("Error promoting user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
