import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    walletAddress?: string;
    kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    role?: 'Regular' | 'Admin';
}

// Simplified User Schema for Backend (KYC Check Focus)
const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: false,
            unique: true,
            lowercase: true,
            trim: true,
        },
        walletAddress: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
        },
        // We only strictly need kycStatus for the AA service logic
        kycStatus: {
            type: String,
            enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
            default: 'NOT_SUBMITTED',
        },
        role: {
            type: String,
            enum: ['Regular', 'Admin'],
            default: 'Regular',
        },
    },
    {
        timestamps: true,
        strict: false // Allow other fields to exist in DB without validation errors
    }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
