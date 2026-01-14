
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("=== CHECKING DB FOR GOI-2030 ===");
    await mongoose.connect(process.env.MONGODB_URI!);

    const bonds = await Bond.find({ bondId: "GOI-2030" });
    console.log(`Found ${bonds.length} documents.`);

    bonds.forEach((b, i) => {
        console.log(`[${i}] ID: ${b._id}`);
        console.log(`    Distributor: ${b.distributorAddress}`);
        console.log(`    Treasury:    ${b.treasuryAddress}`);
        console.log(`    Contract:    ${b.contractAddress}`);
    });

    await mongoose.disconnect();
}

main();
