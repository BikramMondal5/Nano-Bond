
import { ethers } from 'ethers';
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("Checking NEW Bond state...");
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";

    await mongoose.connect(process.env.MONGODB_URI!);
    const bondDoc = await Bond.findOne({ bondId: 'GOI-2030' });
    const bondAddr = bondDoc?.contractAddress;
    console.log(`Bond Address (DB): ${bondAddr}`);

    if (!bondAddr) return;

    const BOND_ABI = [
        "function registry() view returns (address)",
        "function totalBackedValue() view returns (uint256)",
        "function addAsset(string uri, uint256 value) external",
        "function setRegistry(address) external"
    ];

    const bond = new ethers.Contract(bondAddr, BOND_ABI, wallet);

    // 1. Check Registry
    const regAddr = await bond.registry();
    console.log(`Bond Registry: ${regAddr}`);
    console.log(`Config Registry: ${config.contracts.registryAddress}`);

    if (regAddr.toLowerCase() !== config.contracts.registryAddress.toLowerCase()) {
        console.log("⚠️ Registry Mismatch! Fixing...");
        const tx = await bond.setRegistry(config.contracts.registryAddress);
        await tx.wait();
        console.log("✅ Registry Fixed.");
    }

    // 2. Check Backing
    const backing = await bond.totalBackedValue();
    console.log(`Total Backed Value: ${ethers.formatUnits(backing, 6)}`); // assuming 6 decimals logic? No, backing is usually 18 or 6?
    // Wait, Bond is 18 decimals usually (GBOND).
    // addAsset value is usually in 18 decimals?
    // Let's check SovereignBond.sol logic later. Assuming 18 for now.

    if (backing == BigInt(0)) {
        console.log("⚠️ Bond has NO BACKING. Adding Asset...");
        // Add 1M Backing
        const assetValue = ethers.parseUnits("1000000", 18); // 1M GBOND capacity
        const tx = await bond.addAsset("https://gold-reserve.gov/proof.pdf", assetValue);
        console.log(`Asset Added TX: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Asset Backing Added.");
    } else {
        console.log("✅ Bond is Backed.");
    }

    // 3. Verify User on Actual Registry
    const actualRegAddr = await bond.registry();
    const REG_ABI = ["function isVerified(address) view returns (bool)", "function registerIdentity(address, uint16) external"];
    const registry = new ethers.Contract(actualRegAddr, REG_ABI, wallet);
    const isVerified = await registry.isVerified(userAddress);
    console.log(`User Verified on Bond's Registry? ${isVerified}`);

    if (!isVerified) {
        console.log("User NOT verified. Registering...");
        const tx = await registry.registerIdentity(userAddress, 356);
        await tx.wait();
        console.log("✅ User Verified.");
    }

    mongoose.disconnect();
}

main();
