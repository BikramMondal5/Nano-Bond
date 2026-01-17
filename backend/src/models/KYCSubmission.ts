import mongoose, { Schema, Document } from 'mongoose';

export interface IKYCSubmission extends Document {
    walletAddress: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
    kycApprovedAt?: Date;
}

const KYCSubmissionSchema = new Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
            default: 'PENDING'
        },
    },
    {
        timestamps: true,
        strict: false,
        collection: 'kyc_verification' // Match the existing collection name with data
    }
);

export const KYCSubmission = mongoose.models.KYCSubmission || mongoose.model<IKYCSubmission>('KYCSubmission', KYCSubmissionSchema);
