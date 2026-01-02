import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
    try {
        const { email, password, firstName, lastName } = await req.json();

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists with this email" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            provider: "credentials",
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "An error occurred during registration" },
            { status: 500 }
        );
    }
}
