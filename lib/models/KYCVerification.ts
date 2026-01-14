import mongoose, { Schema, model, models } from 'mongoose';

export interface IKYCVerification {
    walletAddress: string;
    aadhaarHash: string;
    kycStatus: 'APPROVED' | 'REJECTED' | 'PENDING' | 'NOT_SUBMITTED';
    kycApprovedAt?: Date;
    txHash?: string;
    riskScore?: number;
    createdAt: Date;
    updatedAt: Date;
}

const KYCVerificationSchema = new Schema<IKYCVerification>(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        aadhaarHash: {
            type: String,
            required: true,
        },
        kycStatus: {
            type: String,
            enum: ['APPROVED', 'REJECTED', 'PENDING', 'NOT_SUBMITTED'],
            default: 'PENDING',
        },
        kycApprovedAt: {
            type: Date,
        },
        txHash: {
            type: String,
        },
        riskScore: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: 'kyc_verification' // Explicit collection name
    }
);

// Prevent overwriting model if already compiled
const KYCVerification = models.KYCVerification || model<IKYCVerification>('KYCVerification', KYCVerificationSchema);

export default KYCVerification;
