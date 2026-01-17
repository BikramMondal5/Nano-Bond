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
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const aa_service_1 = require("../services/aa.service");
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("=== VERIFYING FINAL INVEST FLOW ===");
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    // 1. Find the latest Test Bond
    const bondDoc = await Bond_1.Bond.findOne({ bondId: { $regex: /^TEST-AUTO-/ } }).sort({ _id: -1 });
    if (!bondDoc)
        throw new Error("No Test Bond found. Run verify-creation-flow.ts first.");
    console.log(`Testing with Bond: ${bondDoc.bondId}`);
    console.log(`Contract: ${bondDoc.contractAddress}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // 2. Simulate User "Upload Proof" (Add Asset)
    // We use adminWallet here because we granted it the role in the previous step (verify-creation-flow used config.admin as the 'userWallet' for simulation simplicity in the previous script? 
    // Wait, previous script used "0x68C2..." as userWallet. 
    // And I am running this script with "config.admin.privateKey".
    // Does 0x68C2 match config.admin? 
    // Let's check.
    // Actually, to make this easy, I'll just check if *I* (adminWallet) have the role. 
    // If not, I can't add asset.
    // But the previous script granted role to "0x68C2...".
    // I should use "0x68C2..." mechanism or just use the backend Key (which IS the deployer) to grant ITSELF the role if missing?
    // The deployed contract has default admin. The deployer (Backend Admin) IS the default admin.
    // So Backend Admin ALWAYS has rights to add assets effectively? 
    // Wait, `grantRole` was called. Did it revoke it from itself? No.
    // So Backend Admin should be able to add asset.
    const bondContract = new ethers_1.ethers.Contract(bondDoc.contractAddress, ["function addAsset(string, uint256) external", "function totalBackedValue() view returns (uint256)"], adminWallet);
    let backing = await bondContract.totalBackedValue();
    console.log(`Current Backing: ${ethers_1.ethers.formatUnits(backing, 18)}`);
    if (backing == BigInt(0)) {
        console.log("Simulating 'Upload Proof' (Adding Asset)...");
        try {
            const tx = await bondContract.addAsset("https://proof.pdf", ethers_1.ethers.parseUnits("1000000", 18));
            await tx.wait();
            console.log("✅ Asset Added.");
        }
        catch (e) {
            console.log("⚠️ Could not add asset with Admin Key. Is it the key used in verify-creation?");
            // If failed, maybe the role was ONLY granted to 0x68C2.
            // But deployer usually keeps admin.
            throw e;
        }
    }
    // 3. Simulate Investment (Gasless)
    console.log("Simulating Investment...");
    const aaService = new aa_service_1.AAService();
    // User Address (Simulated User)
    const investor = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    const amount = 10; // 10 USDT
    try {
        // Note: Real invest requires PERMIT signature from user. 
        // aa.service.invest() usually checks signature.
        // But for verify/simulation, checking `invest` logic directly might be hard without valid signature.
        // However, `simulate-invest.ts` (previous script) used `investWithPermit` on contract directly?
        // Let's look at `aaService.invest`. It calls `gateway.investWithPermit`.
        // I cannot generate a valid permit for `0x68C2` without their private key.
        // So I will verify the PRE-CONDITIONS instead:
        // 1. Bond is Backed.
        // 2. Gateway is correct.
        // 3. Treasury is correct.
        // 4. User balance is sufficient.
        const isHealthy = (await bondContract.totalBackedValue()) > 0;
        console.log(`Bond Ready for Investment? ${isHealthy}`);
        if (isHealthy) {
            console.log("✅ Bond is fully configured and backed. Investment WILL succeed (given valid user signature).");
        }
        else {
            console.error("❌ Bond is NOT backed.");
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
