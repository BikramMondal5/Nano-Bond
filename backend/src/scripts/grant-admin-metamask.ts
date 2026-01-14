
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const TARGET_WALLET = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    const BOND_ID = "123457";

    console.log(`Fixing Access for Wallet: ${TARGET_WALLET}`);
    await mongoose.connect(process.env.MONGODB_URI!);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const adminWallet = new ethers.Wallet(config.admin.privateKey!, provider);

    // 1. Get Bond Contract
    const bondDoc = await Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) { console.error("Bond not found"); return; }

    console.log(`Bond Contract: ${bondDoc.contractAddress}`);

    // 2. Grant Admin Role
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const bondContract = new ethers.Contract(bondDoc.contractAddress, ["function grantRole(bytes32, address) external", "function hasRole(bytes32, address) view returns (bool)"], adminWallet);

    const hasRole = await bondContract.hasRole(DEFAULT_ADMIN_ROLE, TARGET_WALLET);
    if (!hasRole) {
        console.log("Granting Admin Role...");
        const tx = await bondContract.grantRole(DEFAULT_ADMIN_ROLE, TARGET_WALLET);
        await tx.wait();
        console.log("✅ Admin Role Granted.");
    } else {
        console.log("✅ Already has Admin Role.");
    }

    // 3. Send USDT (Seed Funds)
    const USDT_ADDRESS = config.contracts.usdtAddress;
    const usdtContract = new ethers.Contract(USDT_ADDRESS, ["function transfer(address, uint256) external", "function balanceOf(address) view returns (uint256)"], adminWallet);

    const balance = await usdtContract.balanceOf(TARGET_WALLET);
    console.log(`Current USDT Balance: ${ethers.formatUnits(balance, 6)}`);

    if (balance < 100n * 1000000n) { // If less than 100 USDT
        console.log("Seeding 1000 USDT...");
        const tx = await usdtContract.transfer(TARGET_WALLET, 1000n * 1000000n);
        await tx.wait();
        console.log("✅ Sent 1000 USDT.");
    } else {
        console.log("✅ Wallet has sufficient funds.");
    }

    await mongoose.disconnect();
}

main();
