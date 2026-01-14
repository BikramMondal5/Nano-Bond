import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from parent directory (backend root)
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in .env');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('govtbond');
        const users = db.collection('kyc_verification');

        const address = '0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d';

        await users.updateOne(
            { walletAddress: address },
            {
                $set: {
                    walletAddress: address,
                    aadhaarHash: 'MANUAL_SEED_HASH',
                    kycStatus: 'APPROVED',
                    kycApprovedAt: new Date(),
                    riskScore: 0
                }
            },
            { upsert: true }
        );

        console.log(`Successfully seeded KYC data for ${address}`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

seed();
