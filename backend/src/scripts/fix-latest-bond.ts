
import { ethers } from 'ethers';
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("Fixing LATEST Bond Registry...");
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);
    const targetRegistry = config.contracts.registryAddress;

    if (!targetRegistry) {
        console.error("Target Registry not in config!");
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    // Find the LATEST bond
    const bond = await Bond.findOne({}).sort({ createdAt: -1 });
    if (!bond) {
        console.error("No bonds found in DB.");
        return;
    }

    const bondAddress = bond.contractAddress;
    console.log(`Fixing Bond: ${bond.bondName} (${bond.bondId})`);
    console.log(`Contract: ${bondAddress}`);

    if (!bondAddress) {
        console.log("No contract address for this bond.");
        return;
    }

    const BOND_ABI = [
        "function registry() view returns (address)",
        "function setRegistry(address) external"
    ];

    const bondContract = new ethers.Contract(bondAddress, BOND_ABI, wallet);
    const currentRegistry = await bondContract.registry();

    console.log(`Current Registry: ${currentRegistry}`);
    console.log(`Target Registry:  ${targetRegistry}`);

    if (currentRegistry.toLowerCase() === targetRegistry.toLowerCase()) {
        console.log("✅ Already matches. No action needed.");
    } else {
        console.log("Mismatch found. Updating Registry...");
        try {
            const tx = await bondContract.setRegistry(targetRegistry);
            console.log(`Transaction Sent: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Registry Updated Successfully.");
        } catch (e: any) {
            console.error("❌ Failed to update registry:", e.message);
        }
    }

    mongoose.disconnect();
}

main();
