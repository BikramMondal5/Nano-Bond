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
const bond_service_1 = require("../services/bond.service");
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("=== VERIFYING CREATE BOND FLOW ===");
    // Connect DB
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const service = new bond_service_1.BondService();
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
        const dbBond = await Bond_1.Bond.findOne({ bondId });
        if (!dbBond)
            throw new Error("Bond not found in DB");
        if (dbBond.treasuryAddress)
            console.log("✅ DB has Treasury Address");
        if (dbBond.distributorAddress)
            console.log("✅ DB has Distributor Address");
        // Verify Roles on Chain
        const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
        const bondContract = new ethers_1.ethers.Contract(result.contractAddress, ["function hasRole(bytes32, address) view returns (bool)"], provider);
        const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
        const hasRole = await bondContract.hasRole(DEFAULT_ADMIN_ROLE, userWallet);
        if (hasRole) {
            console.log("✅ SUCCESS: User HAS Admin Role on new Bond!");
            console.log("User can now upload proof via frontend metamask.");
        }
        else {
            console.error("❌ FAILURE: User missing Admin Role.");
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
