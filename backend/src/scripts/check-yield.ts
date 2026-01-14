
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const TARGET_USER = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8"; // User/Admin
    const BOND_ID = "123457";

    console.log(`Checking Yield State for ${BOND_ID}...`);
    await mongoose.connect(process.env.MONGODB_URI!);

    const bondDoc = await Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) { console.error("Bond not found"); return; }

    console.log(`Distributor Address in DB: ${bondDoc.distributorAddress}`);

    // Check what 0x9e4c... is if it differs
    const errorAddress = "0x9e4c32d3f1e06cc56177438e46A478575462cb0b";
    if (bondDoc.distributorAddress?.toLowerCase() !== errorAddress.toLowerCase()) {
        console.warn(`⚠️ ERROR LOG ADDRESS MISMATCH! Error target: ${errorAddress}`);
    } else {
        console.log("✅ Error target matches DB Distributor.");
    }

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const distContract = new ethers.Contract(bondDoc.distributorAddress!, [
        "function claimableYield(address) view returns (uint256)",
        "function cumulativeYieldPerToken() view returns (uint256)",
        "function userPaidPerToken(address) view returns (uint256)",
        "function rewards(address) view returns (uint256)",
        "function reserve() view returns (uint256)"
    ], provider);

    // Also check USDT balance of distributor
    const usdtContract = new ethers.Contract(config.contracts.usdtAddress, ["function balanceOf(address) view returns (uint256)"], provider);
    const distBalance = await usdtContract.balanceOf(bondDoc.distributorAddress!);
    const reserve = await distContract.reserve();

    const claimable = await distContract.claimableYield(TARGET_USER);
    const cumulative = await distContract.cumulativeYieldPerToken();
    const paid = await distContract.userPaidPerToken(TARGET_USER);
    const currentReward = await distContract.rewards(TARGET_USER);

    console.log(`\n--- Stats for ${TARGET_USER} ---`);
    console.log(`Distributor Balance: ${ethers.formatUnits(distBalance, 6)} USDT`);
    console.log(`Internal Reserve:  ${ethers.formatUnits(reserve, 6)} USDT`);

    console.log(`Claimable Total: ${ethers.formatUnits(claimable, 6)} USDT`);
    console.log(`Cumulative YPT:  ${ethers.formatUnits(cumulative, 6)}`);
    console.log(`User Paid YPT:   ${ethers.formatUnits(paid, 6)}`);
    console.log(`Stored Rewards:  ${ethers.formatUnits(currentReward, 6)}`);

    if (claimable === 0n) {
        console.log("\n❌ NO YIELD TO CLAIM. The 'Distribute Rate' step was likely skipped.");
    }

    await mongoose.disconnect();
}

main();
