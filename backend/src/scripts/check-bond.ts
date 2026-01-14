import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("Checking MongoDB connection...");
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const bondId = 'GOI-2030';
        console.log(`Searching for Bond ID: ${bondId}...`);

        const bond = await Bond.findOne({ bondId });

        if (bond) {
            console.log("Found Bond:", JSON.stringify(bond, null, 2));
            if (!bond.treasuryAddress) {
                console.error("CRITICAL: Bond has no 'treasuryAddress' set!");
            }
        } else {
            console.error(`Bond ${bondId} NOT FOUND in database.`);
            const allBonds = await Bond.find({});
            console.log(`Total Bonds in DB: ${allBonds.length}`);
            allBonds.forEach(b => console.log(`- ${b.bondId}`));
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
