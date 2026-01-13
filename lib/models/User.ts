import mongoose, { Schema, model, models } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IUser {
    _id?: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    image?: string;
    emailVerified?: Date;
    provider?: 'credentials' | 'google' | 'web3auth';
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
    kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    kycApprovedAt?: Date;
    kycExpiresAt?: Date;
    kycRejectionReason?: string;
    aadhaarHash?: string;
    role?: 'Regular' | 'Admin';
    sessionId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            select: false, // Don't include password by default in queries
        },
        image: {
            type: String,
        },
        emailVerified: {
            type: Date,
        },
        provider: {
            type: String,
            enum: ['credentials', 'google', 'web3auth'],
            default: 'credentials',
        },
        walletAddress: {
            type: String,
            unique: true,
            sparse: true, // Allows null values while maintaining uniqueness
        },
        portfolio: {
            totalInvested: {
                type: Number,
                default: 0,
            },
            currentValue: {
                type: Number,
                default: 0,
            },
            bonds: [
                {
                    bondId: {
                        type: String,
                        required: true,
                    },
                    amount: {
                        type: Number,
                        required: true,
                    },
                    purchaseDate: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
        },
        kycStatus: {
            type: String,
            enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
            default: 'NOT_SUBMITTED',
        },
        kycApprovedAt: {
            type: Date,
        },
        kycExpiresAt: {
            type: Date,
        },
        kycRejectionReason: {
            type: String,
        },
        aadhaarHash: {
            type: String,
        },
        role: {
            type: String,
            enum: ['Regular', 'Admin'],
            default: 'Regular',
        },
        sessionId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Middleware to assign role and sessionId
UserSchema.pre("save", async function () {
    if (this.isNew) {
        // Assign Session ID
        if (!this.sessionId) {
            this.sessionId = randomUUID();
        }
    }
});

const User = models.User || model<IUser>('User', UserSchema);

export default User;
