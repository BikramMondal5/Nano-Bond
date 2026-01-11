import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Bond } from '../models/Bond';
import * as dotenv from 'dotenv'; // Ensure dotenv is used

// Load env vars from .env file inside backend directory (or passed via CLI)
dotenv.config();

// Path to registry
const REGISTRY_PATH = path.join(process.cwd(), 'bond-registry.json');
console.log('Registry Path:', REGISTRY_PATH);

async function seed() {
    // Get MONGODB_URI from env
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        // clean old data if you want? No, let's upsert to be safe.

        if (!fs.existsSync(REGISTRY_PATH)) {
            console.error('Registry file not found!');
            process.exit(1);
        }

        const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
        const json = JSON.parse(data);
        const bonds = json.bonds || [];

        console.log(`Found ${bonds.length} bonds in registry.`);

        for (const b of bonds) {
            // Upsert based on bondId
            await Bond.findOneAndUpdate(
                { bondId: b.bondId },
                {
                    $set: {
                        bondName: b.bondName,
                        issuer: b.issuer,
                        couponRate: parseFloat(b.couponRate) || 0, // ensure number
                        startDate: new Date(b.startDate),
                        maturityDate: new Date(b.maturityDate),
                        minInvestment: parseFloat(b.minInvestment) || 0,
                        maxSubscription: parseFloat(b.maxSubscription) || 0,
                        description: b.description,
                        category: b.category,
                        contractAddress: b.contractAddress,
                        treasuryAddress: b.treasuryAddress,
                        distributorAddress: b.distributorAddress,
                        proofUrl: b.proofUrl,
                        adminWallet: b.adminWallet,
                        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
                    }
                },
                { upsert: true, new: true }
            );
            console.log(`Processed bond: ${b.bondName} (${b.bondId})`);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
