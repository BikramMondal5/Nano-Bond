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
// Load .env
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    const TARGET_WALLET = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    const BOND_ID = "123457";
    console.log(`Fixing Access for Wallet: ${TARGET_WALLET}`);
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // 1. Get Bond Contract
    const bondDoc = await Bond_1.Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) {
        console.error("Bond not found");
        return;
    }
    console.log(`Bond Contract: ${bondDoc.contractAddress}`);
    // 2. Grant Admin Role
    const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
    const bondContract = new ethers_1.ethers.Contract(bondDoc.contractAddress, ["function grantRole(bytes32, address) external", "function hasRole(bytes32, address) view returns (bool)"], adminWallet);
    const hasRole = await bondContract.hasRole(DEFAULT_ADMIN_ROLE, TARGET_WALLET);
    if (!hasRole) {
        console.log("Granting Admin Role...");
        const tx = await bondContract.grantRole(DEFAULT_ADMIN_ROLE, TARGET_WALLET);
        await tx.wait();
        console.log("✅ Admin Role Granted.");
    }
    else {
        console.log("✅ Already has Admin Role.");
    }
    // 3. Send USDT (Seed Funds)
    const USDT_ADDRESS = config_1.config.contracts.usdtAddress;
    const usdtContract = new ethers_1.ethers.Contract(USDT_ADDRESS, ["function transfer(address, uint256) external", "function balanceOf(address) view returns (uint256)"], adminWallet);
    const balance = await usdtContract.balanceOf(TARGET_WALLET);
    console.log(`Current USDT Balance: ${ethers_1.ethers.formatUnits(balance, 6)}`);
    if (balance < 100n * 1000000n) { // If less than 100 USDT
        console.log("Seeding 1000 USDT...");
        const tx = await usdtContract.transfer(TARGET_WALLET, 1000n * 1000000n);
        await tx.wait();
        console.log("✅ Sent 1000 USDT.");
    }
    else {
        console.log("✅ Wallet has sufficient funds.");
    }
    await mongoose_1.default.disconnect();
}
main();
