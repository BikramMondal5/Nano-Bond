
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("=== CHECKING BOND 7777785 ===");
    await mongoose.connect(process.env.MONGODB_URI!);

    const bondDoc = await Bond.findOne({ bondId: "7777785" });
    if (!bondDoc) { console.error("Bond not found"); return; }

    console.log(`Contract: ${bondDoc.contractAddress}`);
    console.log(`Treasury: ${bondDoc.treasuryAddress}`);
    console.log(`Distributor: ${bondDoc.distributorAddress}`);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);

    if (bondDoc.distributorAddress) {
        const distContract = new ethers.Contract(bondDoc.distributorAddress, ["function paymentToken() view returns (address)"], provider);
        const token = await distContract.paymentToken();
        const CORRECT = config.contracts.usdtAddress;

        console.log(`Distributor USDT: ${token}`);
        console.log(`Correct USDT:     ${CORRECT}`);

        if (token.toLowerCase() !== CORRECT.toLowerCase()) {
            console.log("❌ MISMATCH DETECTED! Bond needs repair.");
        } else {
            console.log("✅ Configuration looks correct.");
        }
    }

    await mongoose.disconnect();
}

main();
