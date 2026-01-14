
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("Updating Bond in MongoDB...");
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const bondId = 'GOI-2030';

        // Correct Addresses from deployed_addresses.json
        const CORRECT_TREASURY = "0x0192dCAf9B8D52c204E92536c2A8f7fa17a4a0D3";
        const CORRECT_BOND_ADDR = "0x73835207b5DA114Fd1C22f650A2D8E1CFAc9a786";

        const result = await Bond.updateOne(
            { bondId },
            {
                $set: {
                    treasuryAddress: CORRECT_TREASURY,
                    contractAddress: CORRECT_BOND_ADDR
                }
            }
        );

        console.log(`Update Result: matched ${result.matchedCount}, modified ${result.modifiedCount}`);

        if (result.matchedCount > 0) {
            console.log("✅ Bond document updated with correct addresses.");
        } else {
            console.error("❌ Bond NOT FOUND to update!");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
