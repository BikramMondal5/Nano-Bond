
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
    const BOND_ID = '123457';
    console.log(`REPAIRING Bond ${BOND_ID}...`);
    await mongoose.connect(process.env.MONGODB_URI!);

    if (!config.admin.privateKey) {
        console.error("Missing Admin Key");
        return;
    }

    const service = new DeploymentService();
    // 1. Redeploy
    const deployment = await service.deployBondProduct(`REPAIRED Bond ${BOND_ID}`, BOND_ID);

    console.log(`✅ FRESH DEPLOYMENT for ${BOND_ID} COMPLETE:`);
    console.log(`Bond:       ${deployment.contractAddress}`);
    console.log(`Treasury:   ${deployment.treasuryAddress}`);

    // 2. Verify USDT
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const treasury = new ethers.Contract(deployment.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
    const token = await treasury.paymentToken();
    console.log(`New Treasury USDT: ${token}`);

    if (token.toLowerCase() !== config.contracts.usdtAddress.toLowerCase()) {
        console.error("❌ STILL WRONG USDT! CHECK CONFIG!");
        process.exit(1);
    }

    // 3. Grant Admin Role
    const userWallet = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d"; // From user request
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const adminSigner = new ethers.Wallet(config.admin.privateKey, provider);
    const bondContract = new ethers.Contract(deployment.contractAddress, ["function grantRole(bytes32, address) external"], adminSigner);

    console.log(`Granting Admin to ${userWallet}...`);
    await (await bondContract.grantRole(DEFAULT_ADMIN_ROLE, userWallet)).wait();
    console.log("Granted.");

    // 4. Update DB
    console.log("Updating MongoDB...");
    const bondDoc = await Bond.findOne({ bondId: BOND_ID });
    if (bondDoc) {
        bondDoc.contractAddress = deployment.contractAddress;
        bondDoc.treasuryAddress = deployment.treasuryAddress;
        bondDoc.distributorAddress = deployment.distributorAddress;
        bondDoc.status = 'active';
        // Ensure maxSubscription is consistent if needed
        await bondDoc.save();
        console.log("✅ MongoDB Updated.");
    } else {
        console.log(`⚠️ Bond ${BOND_ID} doc not found, checking failure...`);
    }

    await mongoose.disconnect();
}

main();
