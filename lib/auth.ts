import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email }).select("+password");

                if (!user) {
                    throw new Error("No user found with this email");
                }

                if (!user.password) {
                    throw new Error("Please sign in with Google");
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
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    await connectDB();

                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // Create new user from Google OAuth
                        const newUser = await User.create({
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            provider: "google",
                            emailVerified: new Date(),
                        });
                        user.id = newUser._id.toString();
                    } else {
                        // Update existing user
                        if (existingUser.provider !== "google") {
                            existingUser.provider = "google";
                            existingUser.image = user.image;
                            existingUser.emailVerified = new Date();
                            await existingUser.save();
                        }
                        user.id = existingUser._id.toString();
                    }

                    return true;
                } catch (error) {
                    console.error("Error in signIn callback:", error);
                    return false;
                }
            }

            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
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
