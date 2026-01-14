
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

// Load .env explicitly to be safe
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const BOND_ID = '123457';
    console.log(`Checking Bond ${BOND_ID}...`);
    if (!process.env.MONGODB_URI) { console.error("Missing MONGODB_URI"); return; }

    await mongoose.connect(process.env.MONGODB_URI);

    const bond = await Bond.findOne({ bondId: BOND_ID });
    if (!bond) {
        console.log(`Bond ${BOND_ID} NOT FOUND in DB.`);
    } else {
        console.log(`Bond ID: ${bond.bondId}`);
        console.log(`Contract: ${bond.contractAddress}`);
        console.log(`Treasury: ${bond.treasuryAddress}`);

        // Check Payment Token
        const provider = new ethers.JsonRpcProvider(config.rpc.url);
        const treasury = new ethers.Contract(bond.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
        try {
            const token = await treasury.paymentToken();
            console.log(`Treasury USDT: ${token}`);
            console.log(`Config USDT:   ${config.contracts.usdtAddress}`);

            if (token.toLowerCase() !== config.contracts.usdtAddress.toLowerCase()) {
                console.error("❌ CRITICAL: Treasury uses WRONG USDT!");
            } else {
                console.log("✅ Treasury uses Correct USDT.");
            }
        } catch (e: any) {
            console.error("Error reading paymentToken:", e.message);
        }
    }
    await mongoose.disconnect();
}

main();
