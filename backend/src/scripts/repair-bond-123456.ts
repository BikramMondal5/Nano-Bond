
import { DeploymentService } from '../services/deployment.service';
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
    console.log("REPAIRING Bond 123456...");
    await mongoose.connect(process.env.MONGODB_URI!);

    // Ensure we are using the Backend Admin Key
    if (!config.admin.privateKey) {
        console.error("Missing Admin Key");
        return;
    }

    const service = new DeploymentService();
    // Re-Deploy fresh contracts for 123456
    // This creates NEW contracts on chain.
    const deployment = await service.deployBondProduct("REPAIRED Bond 123456", "123456");

    console.log("✅ FRESH DEPLOYMENT for 123456 COMPLETE:");
    console.log(`Bond:       ${deployment.contractAddress}`);
    console.log(`Treasury:   ${deployment.treasuryAddress}`);

    // Verify USDT on New Treasury
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const treasury = new ethers.Contract(deployment.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
    const token = await treasury.paymentToken();
    console.log(`New Treasury USDT: ${token}`);

    if (token.toLowerCase() !== config.contracts.usdtAddress.toLowerCase()) {
        console.error("❌ STILL WRONG USDT! CHECK CONFIG!");
        process.exit(1);
    }

    // Grant Admin Role to User (0x68C2...) so they can upload proof manually
    // Since we are repairing the bond they already tried to use.
    const userWallet = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const adminSigner = new ethers.Wallet(config.admin.privateKey, provider);
    const bondContract = new ethers.Contract(deployment.contractAddress, ["function grantRole(bytes32, address) external"], adminSigner);

    console.log(`Granting Admin to ${userWallet}...`);
    await (await bondContract.grantRole(DEFAULT_ADMIN_ROLE, userWallet)).wait();
    console.log("Granted.");

    // Update DB
    console.log("Updating MongoDB...");
    const bondDoc = await Bond.findOne({ bondId: '123456' });
    if (bondDoc) {
        bondDoc.contractAddress = deployment.contractAddress;
        bondDoc.treasuryAddress = deployment.treasuryAddress;
        bondDoc.distributorAddress = deployment.distributorAddress;
        bondDoc.status = 'active'; // Reset status
        await bondDoc.save();
        console.log("✅ MongoDB Updated.");
    } else {
        console.log("⚠️ Bond 123456 doc not found, creating new...");
        await Bond.create({
            bondId: '123456',
            bondName: 'REPAIRED Bond 123456',
            contractAddress: deployment.contractAddress,
            treasuryAddress: deployment.treasuryAddress,
            distributorAddress: deployment.distributorAddress,
            // Defaults
            couponRate: 0.1,
            minInvestment: 100,
            maxSubscription: 1000000
        });
    }

    await mongoose.disconnect();
}

main();
