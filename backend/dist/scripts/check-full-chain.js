"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("=== CHECKING FULL CHAIN ===");
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    try {
        // 1. DB Check
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        const bondDoc = await Bond_1.Bond.findOne({ bondId: 'GOI-2030' });
        if (!bondDoc)
            throw new Error("Bond GOI-2030 not found in DB");
        const dbTreasury = bondDoc.treasuryAddress;
        const dbBond = bondDoc.contractAddress;
        console.log(`[DB] Treasury: ${dbTreasury}`);
        console.log(`[DB] Bond:     ${dbBond}`);
        // 2. Treasury->Bond Check
        const treasuryCode = await provider.getCode(dbTreasury);
        if (treasuryCode === '0x')
            throw new Error(`Treasury ${dbTreasury} has no code!`);
        const treasury = new ethers_1.ethers.Contract(dbTreasury, ["function bond() view returns (address)"], provider);
        const onChainBond = await treasury.bond();
        console.log(`[Chain] Treasury.bond() -> ${onChainBond}`);
        if (onChainBond.toLowerCase() !== dbBond?.toLowerCase()) {
            console.error("❌ MISMATCH: Treasury points to WRONG Bond!");
            console.log(`Expected (DB): ${dbBond}`);
        }
        else {
            console.log("✅ Treasury points to correct Bond.");
        }
        // 3. Bond->Registry Check
        const bondCode = await provider.getCode(dbBond);
        if (bondCode === '0x')
            throw new Error(`Bond ${dbBond} has no code!`);
        const bond = new ethers_1.ethers.Contract(dbBond, ["function registry() view returns (address)"], provider);
        const onChainRegistry = await bond.registry();
        console.log(`[Chain] Bond.registry() -> ${onChainRegistry}`);
        // 4. Registry->User Check
        const registry = new ethers_1.ethers.Contract(onChainRegistry, ["function isVerified(address) view returns (bool)"], provider);
        const isVerified = await registry.isVerified(userAddress);
        console.log(`[Chain] Registry.isVerified(${userAddress}) -> ${isVerified}`);
        if (!isVerified) {
            console.error("❌ FAILURE ROOT CAUSE: User is NOT verified in this Registry.");
            // AUTO-FIX ATTEMPT
            console.log("ATTEMPTING AUTO-FIX: Registering identity...");
            const regWrite = new ethers_1.ethers.Contract(onChainRegistry, ["function registerIdentity(address, uint16)"], wallet);
            const tx = await regWrite.registerIdentity(userAddress, 356);
            console.log(`Fix TX: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Auto-Fix Complete. User verified.");
        }
        else {
            console.log("✅ User IS verified. The 'NotVerified' error shouldn't happen.");
        }
    }
    catch (e) {
        console.error("Error:", e.message);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
main();
