import mongoose, { Schema, Document } from 'mongoose';

export interface IBond extends Document {
    bondName: string;
    bondId: string;
    issuer: string;
    couponRate: number;
    startDate: Date;
    maturityDate: Date;
    minInvestment: number;
    maxSubscription: number;
    description?: string;
    category?: string;
    contractAddress?: string;
    treasuryAddress?: string;
    distributorAddress?: string;
    proofUrl?: string;
    adminWallet?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const BondSchema = new Schema<IBond>(
    {
        bondName: {
            type: String,
            required: [true, 'Bond name is required'],
            trim: true,
        },
        bondId: {
            type: String,
            required: [true, 'Bond ID is required'],
            unique: true,
            trim: true,
        },
        issuer: {
            type: String,
            required: [true, 'Issuer is required'],
            trim: true,
        },
        couponRate: {
            type: Number,
            required: [true, 'Coupon rate is required'],
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        maturityDate: {
            type: Date,
            required: [true, 'Maturity date is required'],
        },
        minInvestment: {
            type: Number,
            required: [true, 'Minimum investment is required'],
        },
        maxSubscription: {
            type: Number,
            required: [true, 'Maximum subscription is required'],
        },
        description: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
        },
        contractAddress: {
            type: String,
            trim: true,
        },
        treasuryAddress: {
            type: String,
            trim: true,
        },
        distributorAddress: {
            type: String,
            trim: true,
        },
        proofUrl: {
            type: String,
            trim: true,
        },
        adminWallet: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Bond = mongoose.models.Bond || mongoose.model<IBond>('Bond', BondSchema);
