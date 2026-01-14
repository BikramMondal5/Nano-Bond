import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: 'Regular' | 'Admin';
            sessionId?: string;
            walletAddress?: string;
            portfolio?: {
                totalInvested: number;
                currentValue: number;
                bonds: Array<{
                    bondId: string;
                    amount: number;
                    purchaseDate: Date;
                }>;
            };
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role?: 'Regular' | 'Admin';
        sessionId?: string;
        walletAddress?: string;
        portfolio?: {
            totalInvested: number;
            currentValue: number;
            bonds: Array<{
                bondId: string;
                amount: number;
                purchaseDate: Date;
            }>;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role?: 'Regular' | 'Admin';
        sessionId?: string;
    }
}
