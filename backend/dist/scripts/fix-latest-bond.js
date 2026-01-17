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
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("Fixing LATEST Bond Registry...");
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const targetRegistry = config_1.config.contracts.registryAddress;
    if (!targetRegistry) {
        console.error("Target Registry not in config!");
        return;
    }
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    // Find the LATEST bond
    const bond = await Bond_1.Bond.findOne({}).sort({ createdAt: -1 });
    if (!bond) {
        console.error("No bonds found in DB.");
        return;
    }
    const bondAddress = bond.contractAddress;
    console.log(`Fixing Bond: ${bond.bondName} (${bond.bondId})`);
    console.log(`Contract: ${bondAddress}`);
    if (!bondAddress) {
        console.log("No contract address for this bond.");
        return;
    }
    const BOND_ABI = [
        "function registry() view returns (address)",
        "function setRegistry(address) external"
    ];
    const bondContract = new ethers_1.ethers.Contract(bondAddress, BOND_ABI, wallet);
    const currentRegistry = await bondContract.registry();
    console.log(`Current Registry: ${currentRegistry}`);
    console.log(`Target Registry:  ${targetRegistry}`);
    if (currentRegistry.toLowerCase() === targetRegistry.toLowerCase()) {
        console.log("✅ Already matches. No action needed.");
    }
    else {
        console.log("Mismatch found. Updating Registry...");
        try {
            const tx = await bondContract.setRegistry(targetRegistry);
            console.log(`Transaction Sent: ${tx.hash}`);
            await tx.wait();
            console.log("✅ Registry Updated Successfully.");
        }
        catch (e) {
            console.error("❌ Failed to update registry:", e.message);
        }
    }
    mongoose_1.default.disconnect();
}
main();
