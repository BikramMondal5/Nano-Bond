import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestment extends Document {
    walletAddress: string;
    bondId: string;
    type: 'INVEST' | 'REDEEM' | 'CLAIM';
    amount: number;
    txHash: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    timestamp: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
    {
        walletAddress: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        bondId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['INVEST', 'REDEEM', 'CLAIM'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        txHash: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED'],
            default: 'SUCCESS',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export const Investment = mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);
