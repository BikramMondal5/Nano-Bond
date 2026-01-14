
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("Checking Bond Final Details...");
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }
    const uri: string = process.env.MONGODB_URI;

    try {
        await mongoose.connect(uri);
        const bondId = 'GOI-2030';
        const bond = await Bond.findOne({ bondId });

        if (bond) {
            console.log("Bond ID:", bond.bondId);
            console.log("Treasury Address (in DB):", bond.treasuryAddress);
            console.log("Bond Contract Address (in DB):", bond.contractAddress);

            const expectedTreasury = "0x0192dCAf9B8D52c204E92536c2A8f7fa17a4a0D3";
            const expectedBond = "0x73835207b5DA114Fd1C22f650A2D8E1CFAc9a786";

            if (bond.treasuryAddress === expectedTreasury && bond.contractAddress === expectedBond) {
                console.log("✅ DB Data Matches Expected Deployment.");
            } else {
                console.log("❌ DB Data MISMATCH!");
                console.log(`Expected Treasury: ${expectedTreasury}`);
                console.log(`Got: ${bond.treasuryAddress}`);
            }
        } else {
            console.log("Bond not found");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
