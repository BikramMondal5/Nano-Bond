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
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const user = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    // Check the LATEST bond
    const bond = await Bond_1.Bond.findOne({}).sort({ createdAt: -1 });
    if (!bond) {
        console.log("No bonds found in DB.");
        return;
    }
    console.log(`Found Bond: ${bond.bondName} (${bond.bondId})`);
    console.log(`Contract: ${bond.contractAddress}`);
    if (!bond.contractAddress) {
        console.log("No Contract Address!");
        return;
    }
    const BOND_ABI = [
        "function registry() view returns (address)",
        "function assets(uint256) view returns (string, uint256, uint256)",
        "function totalBackedValue() view returns (uint256)"
    ];
    const bondContract = new ethers_1.ethers.Contract(bond.contractAddress, BOND_ABI, provider);
    try {
        const bondRegistry = await bondContract.registry();
        console.log(`Bond Registry:   ${bondRegistry}`);
        console.log(`Config Registry: ${config_1.config.contracts.registryAddress}`);
        if (bondRegistry.toLowerCase() !== config_1.config.contracts.registryAddress.toLowerCase()) {
            console.log("❌ REGISTRY MISMATCH DETECTED!");
            console.log("The Bond is linked to an OLD or DIFFERENT Registry.");
            console.log("The AAService verifies against Config Registry, but Bond checks Bond Registry.");
        }
        else {
            console.log("✅ Registry matches.");
        }
        // Check if user is verified in Bond's Registry
        const REG_ABI = ["function isVerified(address) view returns (bool)"];
        const registryContract = new ethers_1.ethers.Contract(bondRegistry, REG_ABI, provider);
        const isVerified = await registryContract.isVerified(user);
        console.log(`User ${user} Verified in Bond Registry? ${isVerified}`);
        if (!isVerified) {
            console.log("❌ FAILURE REASON: User is NOT verified in the registry this bond uses.");
        }
    }
    catch (e) {
        console.log("Error checking chain:", e.message);
    }
    mongoose_1.default.disconnect();
}
main();
