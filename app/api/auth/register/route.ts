import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { customAlphabet } from 'nanoid';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'email_debug.log');
const log = (msg: string) => {
    try {
        fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
};

export async function POST(req: Request) {
    try {
        log("Received registration request");
        const { email, firstName, lastName } = await req.json();

        // Validation
        if (!email || !firstName || !lastName) {
            log("Validation failed: Missing fields");
            return NextResponse.json(
                { error: "All fields are required" },
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

        // Only numeric characters, length 6
        const nanoidNumbers = customAlphabet('0123456789', 6);
        let secretKey = nanoidNumbers();
        let isUnique = false;

        // Loop to ensure uniqueness
        while (!isUnique) {
            const existingSecretKeyUser = await User.findOne({ secretKey });
            if (!existingSecretKeyUser) {
                isUnique = true;
            } else {
                secretKey = nanoidNumbers();
            }
        }

        // Hash password (using the generated number)
        const hashedPassword = await bcrypt.hash(secretKey, 12);

        // Create new user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            secretKey: secretKey,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            provider: "credentials",
        });

        log(`User created in DB: ${user._id}`);

        // Send the secretKey via email using node mailer
        try {
            log("Attempting to send email...");
            log(`Email User present: ${!!process.env.EMAIL_USER}`);
            log(`Email Pass present: ${!!process.env.EMAIL_PASS}`);
            log(`Email User length: ${process.env.EMAIL_USER?.length}`);

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // Verify connection configuration
            await new Promise((resolve, reject) => {
                transporter.verify(function (error, success) {
                    if (error) {
                        log(`Transporter verification failed: ${error}`);
                        console.error("Transporter verification failed:", error);
                        reject(error);
                    } else {
                        log("Server is ready to take our messages");
                        console.log("Server is ready to take our messages");
                        resolve(success);
                    }
                });
            });

            const emailSubject = "Welcome to NanoBond!";
            const emailText = `Hi ${firstName},

Thanks for joining NanoBond!
Here’s your private secret key — please save it securely:
🔑 ${secretKey}

This key is important for making investment. Do not share it with anyone.

Explore bond offerings, track your portfolio, and start investing!

The NanoBond Team`;

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
                    <p>Hi ${firstName},</p>
                    <p>Thanks for joining NanoBond!</p>
                    <p>Here’s your private secret key — please save it securely:</p>
                    <h2 style="color: #4CAF50;">🔑 ${secretKey}</h2>
                    <p>This key is important for making investment. Do not share it with anyone.</p>
                    <br/>
                    <p>Explore bond offerings, track your portfolio, and start investing!</p>
                    <p>The NanoBond Team</p>
                </div>
            `;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: emailSubject,
                text: emailText,
                html: emailHtml
            };

            const info = await transporter.sendMail(mailOptions);
            log(`Email sent successfully: ${info.messageId}`);
            console.log("Email sent successfully:", info.messageId);

        } catch (emailError: any) {
            log(`Failed to send email Detailed Error: ${emailError.message}`);
            log(`SMTP Response: ${emailError.response}`);
            console.error("Failed to send email Detailed Error:", emailError);
            if (emailError.response) {
                console.error("SMTP Response:", emailError.response);
            }
        }

        return NextResponse.json(
            {
                message: "User created successfully. Check your email for the secret key.",
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        log(`Registration error: ${error}`);
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "An error occurred during registration" },
            { status: 500 }
        );
    }
}
