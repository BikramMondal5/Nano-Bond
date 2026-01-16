import { MongoClient, Db, Collection } from 'mongodb';
import { config } from '../config';

export interface TransactionRecord {
    txHash: string;
    userAddress: string;
    type: 'INVEST' | 'REDEEM' | 'CLAIM' | 'DEPOSIT' | 'WITHDRAW' | 'FAUCET';
    amount: number;
    currency: string;
    bondId?: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

interface TransactionDoc {
    walletAddress: string;
    bondId?: string;
    type: string;
    amount: number;
    currency?: string;
    txHash: string;
    status: string;
    timestamp: Date;
}

export class DbService {
    private mongoClient: MongoClient | null = null;
    private db: Db | null = null;
    private transactionsCollection: Collection<TransactionDoc> | null = null;

    constructor() {
        this.initMongoDB();
    }

    private async initMongoDB() {
        if (!config.mongodb.uri) {
            console.warn('[DbService] No MONGODB_URI found. Transaction history disabled.');
            return;
        }

        try {
            this.mongoClient = new MongoClient(config.mongodb.uri);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('govtbond');
            this.transactionsCollection = this.db.collection<TransactionDoc>('investments');

            // Create indexes for performance
            await this.ensureIndexes();

            console.log('[DbService] Connected to MongoDB (investments collection)');
        } catch (error) {
            console.error('[DbService] Failed to connect to MongoDB:', error);
        }
    }

    private async ensureIndexes() {
        if (!this.transactionsCollection) return;
        try {
            await this.transactionsCollection.createIndex({ walletAddress: 1, timestamp: -1 });
            await this.transactionsCollection.createIndex({ txHash: 1 }, { unique: true });
            console.log('[DbService] Indexes ensured');
        } catch (error) {
            console.error('[DbService] Failed to create indexes:', error);
        }
    }

    async recordTransaction(tx: TransactionRecord) {
        if (!this.transactionsCollection) {
            console.warn('[DbService] MongoDB not connected, skipping transaction record');
            return;
        }

        try {
            await this.transactionsCollection.insertOne({
                walletAddress: tx.userAddress.toLowerCase(), // Normalize to lowercase
                bondId: tx.bondId || undefined,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency || 'USDT',
                txHash: tx.txHash,
                status: tx.status,
                timestamp: new Date(),
            });
            console.log(`[DbService] Recorded ${tx.type} transaction: ${tx.txHash}`);
        } catch (err: any) {
            // Ignore duplicate key errors (transaction already recorded)
            if (err.code === 11000) {
                console.log(`[DbService] Transaction ${tx.txHash} already exists, skipping`);
                return;
            }
            console.error('[DbService] Failed to record transaction:', err);
        }
    }

    async getUserHistory(address: string) {
        if (!this.transactionsCollection) {
            console.warn('[DbService] MongoDB not connected, returning empty history');
            return [];
        }

        try {
            // Normalized query for wallet address (exact match, blazing fast with index)
            const transactions = await this.transactionsCollection
                .find({ walletAddress: address.toLowerCase() })
                .sort({ timestamp: -1 })
                .limit(100)
                .toArray();

            return transactions.map((row) => {
                let frontendType = 'UNKNOWN';
                switch (row.type) {
                    case 'INVEST': frontendType = 'INVESTMENT'; break;
                    case 'FAUCET': frontendType = 'DEPOSIT'; break;
                    case 'DEPOSIT': frontendType = 'DEPOSIT'; break;
                    case 'CLAIM': frontendType = 'COUPON'; break;
                    case 'REDEEM': frontendType = 'WITHDRAW'; break;
                    case 'WITHDRAW': frontendType = 'WITHDRAW'; break;
                }

                return {
                    txHash: row.txHash,
                    type: frontendType,
                    amount: row.amount,
                    currency: row.currency || 'USDT',
                    timestamp: row.timestamp,
                    asset: row.currency || 'USDT',
                    details: row.bondId ? `Bond: ${row.bondId}` : 'Transaction'
                };
            });
        } catch (err) {
            console.error('[DbService] Failed to fetch history:', err);
            return [];
        }
    }
}
