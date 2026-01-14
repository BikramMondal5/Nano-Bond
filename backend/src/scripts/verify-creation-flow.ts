
import { BondService } from '../services/bond.service';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("=== VERIFYING CREATE BOND FLOW ===");

    // Connect DB
    await mongoose.connect(process.env.MONGODB_URI!);

    const service = new BondService();
    // Simulate User Wallet (random valid address or specific test address)
    const userWallet = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    const bondId = `TEST-AUTO-${Date.now().toString().slice(-4)}`;

    console.log(`Creating Bond: ${bondId} for Admin: ${userWallet}`);

    try {
        const details = {
            bondId: bondId,
            bondName: "Automated Test Bond",
            issuer: "Auto Tester",
            couponRate: 0.10,
            minInvestment: 50,
            maxSubscription: 100000,
            startDate: new Date(),
            maturityDate: new Date(Date.now() + 31536000000), // +1 year
            description: "Automated creation test"
        };

        const result = await service.createManagedBond(details, userWallet);
        console.log("✅ Bond Created Service returned:", result.contractAddress);

        // Verify DB
        const dbBond = await Bond.findOne({ bondId });
        if (!dbBond) throw new Error("Bond not found in DB");
        if (dbBond.treasuryAddress) console.log("✅ DB has Treasury Address");
        if (dbBond.distributorAddress) console.log("✅ DB has Distributor Address");

        // Verify Roles on Chain
        const provider = new ethers.JsonRpcProvider(config.rpc.url);
        const bondContract = new ethers.Contract(
            result.contractAddress,
            ["function hasRole(bytes32, address) view returns (bool)"],
            provider
        );

        const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
        const hasRole = await bondContract.hasRole(DEFAULT_ADMIN_ROLE, userWallet);

        if (hasRole) {
            console.log("✅ SUCCESS: User HAS Admin Role on new Bond!");
            console.log("User can now upload proof via frontend metamask.");
        } else {
            console.error("❌ FAILURE: User missing Admin Role.");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

main();
