import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestment extends Document {
    walletAddress: string;
    bondId: string;
    type: 'INVEST' | 'REDEEM' | 'CLAIM' | 'INVEST_CROSS_CHAIN'; // Add cross-chain type
    amount: number;
    txHash: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    network: 'mantle' | 'ethereum' | 'arbitrum' | 'linea' | 'polygon' | 'scroll'; // Add network field
    sourceNetwork?: string; // For cross-chain investments
    destinationNetwork?: string; // For cross-chain investments
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
            enum: ['INVEST', 'REDEEM', 'CLAIM', 'INVEST_CROSS_CHAIN'], // Add cross-chain type
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
        network: {
            type: String,
            enum: ['mantle', 'ethereum', 'arbitrum', 'linea', 'polygon', 'scroll'],
            default: 'mantle',
            required: true,
            index: true, // Add index for faster queries by network
        },
        sourceNetwork: {
            type: String,
            enum: ['mantle', 'ethereum', 'arbitrum', 'linea', 'polygon', 'scroll'],
            required: false, // Only for cross-chain transactions
        },
        destinationNetwork: {
            type: String,
            enum: ['mantle', 'ethereum', 'arbitrum', 'linea', 'polygon', 'scroll'],
            required: false, // Only for cross-chain transactions
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

// Add compound index for efficient querying by wallet and network
InvestmentSchema.index({ walletAddress: 1, network: 1 });

export const Investment = mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);