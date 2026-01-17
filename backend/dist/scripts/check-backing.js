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
    console.log("Checking NEW Bond state...");
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const bondDoc = await Bond_1.Bond.findOne({ bondId: 'GOI-2030' });
    const bondAddr = bondDoc?.contractAddress;
    console.log(`Bond Address (DB): ${bondAddr}`);
    if (!bondAddr)
        return;
    const BOND_ABI = [
        "function registry() view returns (address)",
        "function totalBackedValue() view returns (uint256)",
        "function addAsset(string uri, uint256 value) external",
        "function setRegistry(address) external"
    ];
    const bond = new ethers_1.ethers.Contract(bondAddr, BOND_ABI, wallet);
    // 1. Check Registry
    const regAddr = await bond.registry();
    console.log(`Bond Registry: ${regAddr}`);
    console.log(`Config Registry: ${config_1.config.contracts.registryAddress}`);
    if (regAddr.toLowerCase() !== config_1.config.contracts.registryAddress.toLowerCase()) {
        console.log("⚠️ Registry Mismatch! Fixing...");
        const tx = await bond.setRegistry(config_1.config.contracts.registryAddress);
        await tx.wait();
        console.log("✅ Registry Fixed.");
    }
    // 2. Check Backing
    const backing = await bond.totalBackedValue();
    console.log(`Total Backed Value: ${ethers_1.ethers.formatUnits(backing, 6)}`); // assuming 6 decimals logic? No, backing is usually 18 or 6?
    // Wait, Bond is 18 decimals usually (GBOND).
    // addAsset value is usually in 18 decimals?
    // Let's check SovereignBond.sol logic later. Assuming 18 for now.
    if (backing == BigInt(0)) {
        console.log("⚠️ Bond has NO BACKING. Adding Asset...");
        // Add 1M Backing
        const assetValue = ethers_1.ethers.parseUnits("1000000", 18); // 1M GBOND capacity
        const tx = await bond.addAsset("https://gold-reserve.gov/proof.pdf", assetValue);
        console.log(`Asset Added TX: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Asset Backing Added.");
    }
    else {
        console.log("✅ Bond is Backed.");
    }
    // 3. Verify User on Actual Registry
    const actualRegAddr = await bond.registry();
    const REG_ABI = ["function isVerified(address) view returns (bool)", "function registerIdentity(address, uint16) external"];
    const registry = new ethers_1.ethers.Contract(actualRegAddr, REG_ABI, wallet);
    const isVerified = await registry.isVerified(userAddress);
    console.log(`User Verified on Bond's Registry? ${isVerified}`);
    if (!isVerified) {
        console.log("User NOT verified. Registering...");
        const tx = await registry.registerIdentity(userAddress, 356);
        await tx.wait();
        console.log("✅ User Verified.");
    }
    mongoose_1.default.disconnect();
}
main();
