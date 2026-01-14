import NextAuth, { NextAuthConfig } from "next-auth";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

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

                    if (!user) {
                        user = await User.create({
                            email,
                            name: credentials.web3auth_name || email.split("@")[0],
                            provider: "web3auth",
                            emailVerified: new Date(),
                        });
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
