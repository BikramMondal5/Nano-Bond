import NextAuth, { NextAuthConfig } from "next-auth";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { customAlphabet } from 'nanoid';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'auth_debug.log');
const log = (msg: string) => {
    try {
        fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
};

export const authConfig: NextAuthConfig = {
    providers: [

        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                web3auth_email: { label: "Web3Auth Email", type: "text" },
                web3auth_name: { label: "Web3Auth Name", type: "text" },
            },
            async authorize(credentials) {
                if (credentials?.web3auth_email) {
                    await connectDB();
                    const email = credentials.web3auth_email as string;
                    let user = await User.findOne({ email });

                    // ... existing imports

                    // ... existing imports

                    if (!user) {
                        log(`Creating new user for ${email}`);
                        // Generate Unique Secret Key
                        const nanoidNumbers = customAlphabet('0123456789', 6);
                        let secretKey = nanoidNumbers();
                        let isUnique = false;

                        while (!isUnique) {
                            const existingSecretKeyUser = await User.findOne({ secretKey });
                            if (!existingSecretKeyUser) {
                                isUnique = true;
                            } else {
                                secretKey = nanoidNumbers();
                            }
                        }

                        // Hash password/secretKey
                        const hashedPassword = await bcrypt.hash(secretKey, 12);

                        user = await User.create({
                            email,
                            name: credentials.web3auth_name || email.split("@")[0],
                            provider: "web3auth",
                            emailVerified: new Date(),
                            secretKey: secretKey,
                            password: hashedPassword, // Storing hash of secretKey as password
                        });

                        // Send Email
                        try {
                            log("Attempting to send email to Web3 User...");
                            const transporter = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true,
                                auth: {
                                    user: process.env.EMAIL_USER,
                                    pass: process.env.EMAIL_PASS,
                                },
                            });

                            const firstName = (credentials.web3auth_name as string)?.split(' ')[0] || "User";
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

                            await transporter.sendMail({
                                from: process.env.EMAIL_USER,
                                to: email,
                                subject: emailSubject,
                                text: emailText,
                                html: emailHtml
                            });
                            log(`Email sent to ${email}`);

                        } catch (emailError: any) {
                            log(`Failed to send email to Web3 User: ${emailError.message}`);
                            console.error("Failed to send email to Web3 User:", emailError);
                        }
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name || `${user.firstName} ${user.lastName}`.trim(),
                        image: user.image,
                        role: user.role,
                        sessionId: user.sessionId,
                    };
                }

                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email }).select("+password");

                if (!user) {
                    throw new Error("No user found with this email");
                }

                if (!user.password && user.provider === "web3auth") {
                    throw new Error("Please sign in with Web3Auth");
                }

                if (!user.password) {
                    throw new Error("Please sign in with your provider");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name || `${user.firstName} ${user.lastName}`.trim(),
                    image: user.image,
                    role: user.role,
                    sessionId: user.sessionId,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {


            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.sessionId = user.sessionId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;

                // Fetch additional user data from database
                try {
                    await connectDB();
                    // Query by email only since token.id might be a UUID from NextAuth
                    const dbUser = await User.findOne({ email: session.user.email });

                    if (dbUser) {
                        session.user.id = dbUser._id.toString();
                        session.user.walletAddress = dbUser.walletAddress;
                        session.user.portfolio = dbUser.portfolio;
                        session.user.role = dbUser.role;
                        session.user.sessionId = dbUser.sessionId;
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        signOut: "/",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
