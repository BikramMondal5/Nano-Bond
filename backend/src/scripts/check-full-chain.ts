
import { ethers } from 'ethers';
import { config } from '../config';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("=== CHECKING FULL CHAIN ===");
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";

    try {
        // 1. DB Check
        await mongoose.connect(process.env.MONGODB_URI!);
        const bondDoc = await Bond.findOne({ bondId: 'GOI-2030' });
        if (!bondDoc) throw new Error("Bond GOI-2030 not found in DB");

        const dbTreasury = bondDoc.treasuryAddress;
        const dbBond = bondDoc.contractAddress;
        console.log(`[DB] Treasury: ${dbTreasury}`);
        console.log(`[DB] Bond:     ${dbBond}`);

        // 2. Treasury->Bond Check
        const treasuryCode = await provider.getCode(dbTreasury!);
        if (treasuryCode === '0x') throw new Error(`Treasury ${dbTreasury} has no code!`);

        const treasury = new ethers.Contract(dbTreasury!, ["function bond() view returns (address)"], provider);
        const onChainBond = await treasury.bond();
        console.log(`[Chain] Treasury.bond() -> ${onChainBond}`);

        if (onChainBond.toLowerCase() !== dbBond?.toLowerCase()) {
            console.error("❌ MISMATCH: Treasury points to WRONG Bond!");
            console.log(`Expected (DB): ${dbBond}`);
        } else {
            console.log("✅ Treasury points to correct Bond.");
        }

        // 3. Bond->Registry Check
        const bondCode = await provider.getCode(dbBond!);
        if (bondCode === '0x') throw new Error(`Bond ${dbBond} has no code!`);

        const bond = new ethers.Contract(dbBond!, ["function registry() view returns (address)"], provider);
        const onChainRegistry = await bond.registry();
        console.log(`[Chain] Bond.registry() -> ${onChainRegistry}`);

        // 4. Registry->User Check
        const registry = new ethers.Contract(onChainRegistry, ["function isVerified(address) view returns (bool)"], provider);
        const isVerified = await registry.isVerified(userAddress);
        console.log(`[Chain] Registry.isVerified(${userAddress}) -> ${isVerified}`);

        if (!isVerified) {
            console.error("❌ FAILURE ROOT CAUSE: User is NOT verified in this Registry.");
            // AUTO-FIX ATTEMPT
            console.log("ATTEMPTING AUTO-FIX: Registering identity...");
            const regWrite = new ethers.Contract(onChainRegistry, ["function registerIdentity(address, uint16)"], wallet);
            const tx = await regWrite.registerIdentity(userAddress, 356);
            console.log(`Fix TX: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Auto-Fix Complete. User verified.");
        } else {
            console.log("✅ User IS verified. The 'NotVerified' error shouldn't happen.");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

main();
