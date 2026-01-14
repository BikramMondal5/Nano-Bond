
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
    console.log("Checking Bond 123456...");
    if (!process.env.MONGODB_URI) { console.error("Missing MONGODB_URI"); return; }

    await mongoose.connect(process.env.MONGODB_URI);

    const bond = await Bond.findOne({ bondId: '123456' });
    if (!bond) {
        console.log("Bond 123456 NOT FOUND in DB.");
    } else {
        console.log(`Bond ID: ${bond.bondId}`);
        console.log(`Contract: ${bond.contractAddress}`);
        console.log(`Treasury: ${bond.treasuryAddress}`);

        const suspect = "0xbe6987a75e31dd7ee208349d7404da7d3e066db6";
        if (bond.treasuryAddress?.toLowerCase() === suspect.toLowerCase()) {
            console.log("MATCH! The error spender IS the Treasury.");

            // Check Payment Token
            const provider = new ethers.JsonRpcProvider(config.rpc.url);
            const treasury = new ethers.Contract(bond.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
            try {
                const token = await treasury.paymentToken();
                console.log(`Treasury USDT: ${token}`);
                console.log(`Config USDT:   ${config.contracts.usdtAddress}`);

                if (token.toLowerCase() !== config.contracts.usdtAddress.toLowerCase()) {
                    console.error("❌ CRITICAL: Treasury uses WRONG USDT!");
                    console.log("This causes 'Insufficient Allowance' because Gateway approves Correct USDT, but Treasury pulls Wrong USDT.");
                } else {
                    console.log("✅ Treasury uses Correct USDT.");
                }
            } catch (e: any) {
                console.error("Error reading paymentToken:", e.message);
            }
        } else {
            console.log("NO MATCH. The error spender is NOT the Treasury.");
            console.log(`Error Spender: ${suspect}`);
        }
    }
    await mongoose.disconnect();
}

main();
