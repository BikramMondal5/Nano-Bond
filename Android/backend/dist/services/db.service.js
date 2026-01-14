"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const pg_1 = require("pg");
class DbService {
    constructor() {
        // Fallback for missing env during dev
        if (!process.env.DATABASE_URL) {
            console.warn('[DbService] No DATABASE_URL found. History tracking disabled.');
        }
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Required for Neon
        });
        if (process.env.DATABASE_URL) {
            this.init();
        }
    }
    async init() {
        try {
            const client = await this.pool.connect();
            await client.query(`
                CREATE TABLE IF NOT EXISTS transactions (
                    tx_hash VARCHAR(66) PRIMARY KEY,
                    user_address VARCHAR(42) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    amount NUMERIC NOT NULL,
                    currency VARCHAR(10) NOT NULL,
                    bond_id VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'SUCCESS',
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                -- Auto-migration for existing tables (ensure all columns exist)
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bond_id VARCHAR(50);
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SUCCESS';
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USDT';
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'UNKNOWN';
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
                ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_address VARCHAR(42);

                CREATE INDEX IF NOT EXISTS idx_user_address ON transactions(user_address);
            `);
            client.release();
            console.log('[DbService] Database initialized successfully');
        }
        catch (err) {
            console.error('[DbService] Initialization failed:', err);
        }
    }
    async recordTransaction(tx) {
        if (!process.env.DATABASE_URL)
            return;
        try {
            const query = `
                INSERT INTO transactions (tx_hash, user_address, type, amount, currency, bond_id, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (tx_hash) DO NOTHING
            `;
            const values = [
                tx.txHash,
                tx.userAddress,
                tx.type,
                tx.amount,
                tx.currency,
                tx.bondId || null,
                tx.status
            ];
            await this.pool.query(query, values);
            console.log(`[DbService] Recorded ${tx.type} transaction: ${tx.txHash}`);
        }
        catch (err) {
            console.error('[DbService] Failed to record transaction:', err);
        }
    }
    async getUserHistory(address) {
        if (!process.env.DATABASE_URL)
            return [];
        try {
            const res = await this.pool.query(`SELECT * FROM transactions WHERE user_address = $1 ORDER BY created_at DESC`, [address]);
            return res.rows.map(row => {
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
                    txHash: row.tx_hash,
                    type: frontendType,
                    amount: parseFloat(row.amount),
                    currency: row.currency,
                    timestamp: row.created_at,
                    asset: row.currency,
                    details: row.bond_id ? `Bond: ${row.bond_id}` : 'Transaction'
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
