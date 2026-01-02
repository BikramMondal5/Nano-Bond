import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
    _id?: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    image?: string;
    emailVerified?: Date;
    provider?: 'credentials' | 'google';
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
            enum: ['credentials', 'google'],
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
    },
    {
        timestamps: true,
    }
);

// Indexes are already created via unique: true in schema, no need to duplicate
// UserSchema.index({ email: 1 });
// UserSchema.index({ walletAddress: 1 });

const User = models.User || model<IUser>('User', UserSchema);

export default User;
