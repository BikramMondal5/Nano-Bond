
import { ethers } from 'ethers';
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Known Errors
const ERRORS = {
    "0xb12c8f91": "NotVerified",
    "0xfb8f41b2": "ERC20InsufficientAllowance",
    "0xe51025e4": "ExceedsBackedLogic", // Calculated guess, will verify or use hash
    // We can calculate on the fly
};

async function main() {
    console.log("Debugging Investment Error...");
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    await mongoose.connect(process.env.MONGODB_URI!);

    // Get LATEST bond
    const bond = await Bond.findOne({}).sort({ createdAt: -1 });
    if (!bond) { console.log("No bonds."); return; }

    console.log(`Testing Bond: ${bond.bondName}`);
    console.log(`Address: ${bond.contractAddress}`);
    console.log(`Treasury: ${bond.treasuryAddress}`);

    // Checks
    const bondContract = new ethers.Contract(bond.contractAddress, [
        "function totalBackedValue() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function registry() view returns (address)"
    ], provider);

    const backed = await bondContract.totalBackedValue();
    const supply = await bondContract.totalSupply();
    const registry = await bondContract.registry();

    console.log(`Backed: ${backed}, Supply: ${supply}`);
    console.log(`Registry: ${registry}`);

    if (backed == 0n) {
        console.log("⚠️ WARNING: Bond has 0 Backing. 'ExceedsBackedLogic' is likely.");
    }

    // Identify Error Selector from User Input or Log
    // User provided: 0xb12c8f91 (NotVerified) in previous logs.
    // If they get it NOW, it means they are using an OLD bond (since new code doesn't have it?)
    // Wait, if we RECOMPILED, the new bytecode DOES NOT have the check.
    // But the OLD bond deployed on chain DOES.

    // We can't easily reproduce the "Gateway error" without calling it, 
    // but the state analysis above is strong enough.

    mongoose.disconnect();
}

main();
