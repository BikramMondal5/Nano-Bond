"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
class DbService {
    constructor() {
        this.mongoClient = null;
        this.db = null;
        this.transactionsCollection = null;
        this.initMongoDB();
    }
    async initMongoDB() {
        if (!config_1.config.mongodb.uri) {
            console.warn('[DbService] No MONGODB_URI found. Transaction history disabled.');
            return;
        }
        try {
            this.mongoClient = new mongodb_1.MongoClient(config_1.config.mongodb.uri);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('govtbond');
            this.transactionsCollection = this.db.collection('investments');
            console.log('[DbService] Connected to MongoDB (investments collection)');
        }
        catch (error) {
            console.error('[DbService] Failed to connect to MongoDB:', error);
        }
    }
    async recordTransaction(tx) {
        if (!this.transactionsCollection) {
            console.warn('[DbService] MongoDB not connected, skipping transaction record');
            return;
        }
        try {
            await this.transactionsCollection.insertOne({
                walletAddress: tx.userAddress,
                bondId: tx.bondId || undefined,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency || 'USDT',
                txHash: tx.txHash,
                status: tx.status,
                timestamp: new Date(),
            });
            console.log(`[DbService] Recorded ${tx.type} transaction: ${tx.txHash}`);
        }
        catch (err) {
            // Ignore duplicate key errors (transaction already recorded)
            if (err.code === 11000) {
                console.log(`[DbService] Transaction ${tx.txHash} already exists, skipping`);
                return;
            }
            console.error('[DbService] Failed to record transaction:', err);
        }
    }
    async getUserHistory(address) {
        if (!this.transactionsCollection) {
            console.warn('[DbService] MongoDB not connected, returning empty history');
            return [];
        }
        try {
            // Case-insensitive query for wallet address
            const transactions = await this.transactionsCollection
                .find({ walletAddress: { $regex: new RegExp(`^${address}$`, 'i') } })
                .sort({ timestamp: -1 })
                .limit(100)
                .toArray();
            return transactions.map((row) => {
                let frontendType = 'UNKNOWN';
                switch (row.type) {
                    case 'INVEST':
                        frontendType = 'INVESTMENT';
                        break;
                    case 'FAUCET':
                        frontendType = 'DEPOSIT';
                        break;
                    case 'DEPOSIT':
                        frontendType = 'DEPOSIT';
                        break;
                    case 'CLAIM':
                        frontendType = 'COUPON';
                        break;
                    case 'REDEEM':
                        frontendType = 'WITHDRAW';
                        break;
                    case 'WITHDRAW':
                        frontendType = 'WITHDRAW';
                        break;
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
        }
        catch (err) {
            console.error('[DbService] Failed to fetch history:', err);
            return [];
        }
    }
}
exports.DbService = DbService;
