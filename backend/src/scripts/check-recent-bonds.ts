
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }
    const uri: string = process.env.MONGODB_URI;

    try {
        await mongoose.connect(uri);

        // List recent bonds
        const bonds = await Bond.find({}).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${bonds.length} recent bonds:`);
        for (const b of bonds) {
            console.log(`\nID: ${b.bondId}`);
            console.log(`Name: ${b.bondName}`);
            console.log(`Contract: ${b.contractAddress}`);
            console.log(`Treasury: ${b.treasuryAddress}`);
            console.log(`Distributor: ${b.distributorAddress}`);
            console.log(`Created: ${b.createdAt}`);

            // Validation
            if (!b.contractAddress) console.warn("⚠️ MISSING CONTRACT ADDRESS");
            if (!b.treasuryAddress) console.warn("⚠️ MISSING TREASURY ADDRESS");

            // Check backing if address exists
            if (b.contractAddress && b.contractAddress.startsWith("0x")) {
                // We could check backing here if we had provider
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
