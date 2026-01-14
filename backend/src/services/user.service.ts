import { MongoClient, Db, Collection } from 'mongodb';
import { config } from '../config';

export interface User {
    walletAddress: string;
    aadhaarHash: string;
    kycStatus: 'APPROVED' | 'REJECTED' | 'PENDING' | 'NOT_SUBMITTED';
    kycApprovedAt?: Date;
    txHash?: string;
    riskScore?: number;
}

export class UserService {
    private mongoClient: MongoClient | null = null;
    private db: Db | null = null;
    private usersCollection: Collection<User> | null = null;

    constructor() {
        this.initMongoDB();
    }

    private async initMongoDB() {
        if (!config.mongodb.uri) {
            console.warn('[UserService] No MONGODB_URI found. User persistence disabled.');
            return;
        }

        try {
            this.mongoClient = new MongoClient(config.mongodb.uri);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('govtbond'); // Same DB as bonds
            this.usersCollection = this.db.collection<User>('kyc_verification'); // Separate collection

            // Create index on walletAddress for fast lookups
            await this.usersCollection.createIndex({ walletAddress: 1 }, { unique: true });

            console.log('[UserService] Connected to MongoDB (kyc_verification collection)');
        } catch (error) {
            console.error('[UserService] Failed to connect to MongoDB:', error);
        }
    }

    /**
     * Register or update a verified user
     */
    async registerUser(user: Partial<User> & { walletAddress: string }): Promise<void> {
        if (!this.usersCollection) return;

        try {
            // Upsert: If user exists (e.g. created by website auth), update KYC fields.
            // If not, create new (might miss email, but allows API-only usage).
            await this.usersCollection.updateOne(
                { walletAddress: user.walletAddress },
                { $set: user },
                { upsert: true }
            );
            console.log(`[UserService] Saved KYC data for ${user.walletAddress}`);
        } catch (error) {
            console.error('[UserService] Failed to save user:', error);
            throw error;
        }
    }

    /**
     * Get user verification status
     */
    async getUserStatus(walletAddress: string): Promise<{ isVerified: boolean; user?: User }> {
        if (!this.usersCollection) {
            return { isVerified: false };
        }

        try {
            const user = await this.usersCollection.findOne({ walletAddress });
            if (user && user.kycStatus === 'APPROVED') {
                return { isVerified: true, user };
            }
            return { isVerified: false };
        } catch (error) {
            console.error('[UserService] Failed to get user status:', error);
            return { isVerified: false };
        }
    }
}
