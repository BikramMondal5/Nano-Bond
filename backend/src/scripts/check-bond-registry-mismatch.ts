
import { ethers } from 'ethers';
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const user = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";

    await mongoose.connect(process.env.MONGODB_URI!);

    // Find the bond
    const bond = await Bond.findOne({ bondName: 'IIT KGP2' });

    if (!bond) {
        console.log("Bond 'IIT KGP2' NOT FOUND in DB.");
        const all = await Bond.find({}, { bondName: 1, bondId: 1 }).sort({ createdAt: -1 }).limit(10);
        console.log("Recent bonds:", all.map(b => b.bondName));
        return;
    }

    console.log(`Found Bond: ${bond.bondName} (${bond.bondId})`);
    console.log(`Contract: ${bond.contractAddress}`);

    if (!bond.contractAddress) {
        console.log("No Contract Address!");
        return;
    }

    const BOND_ABI = [
        "function registry() view returns (address)",
        "function assets(uint256) view returns (string, uint256, uint256)",
        "function totalBackedValue() view returns (uint256)"
    ];

    const bondContract = new ethers.Contract(bond.contractAddress, BOND_ABI, provider);

    try {
        const bondRegistry = await bondContract.registry();
        console.log(`Bond Registry:   ${bondRegistry}`);
        console.log(`Config Registry: ${config.contracts.registryAddress}`);

        if (bondRegistry.toLowerCase() !== config.contracts.registryAddress.toLowerCase()) {
            console.log("❌ REGISTRY MISMATCH DETECTED!");
            console.log("The Bond is linked to an OLD or DIFFERENT Registry.");
            console.log("The AAService verifies against Config Registry, but Bond checks Bond Registry.");
        } else {
            console.log("✅ Registry matches.");
        }

        // Check if user is verified in Bond's Registry
        const REG_ABI = ["function isVerified(address) view returns (bool)"];
        const registryContract = new ethers.Contract(bondRegistry, REG_ABI, provider);
        const isVerified = await registryContract.isVerified(user);
        console.log(`User ${user} Verified in Bond Registry? ${isVerified}`);

        if (!isVerified) {
            console.log("❌ FAILURE REASON: User is NOT verified in the registry this bond uses.");
        }

    } catch (e: any) {
        console.log("Error checking chain:", e.message);
    }

    mongoose.disconnect();
}

main();
