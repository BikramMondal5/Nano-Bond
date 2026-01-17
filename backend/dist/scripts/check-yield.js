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
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    const TARGET_USER = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8"; // User/Admin
    const BOND_ID = "123457";
    console.log(`Checking Yield State for ${BOND_ID}...`);
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const bondDoc = await Bond_1.Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) {
        console.error("Bond not found");
        return;
    }
    console.log(`Distributor Address in DB: ${bondDoc.distributorAddress}`);
    // Check what 0x9e4c... is if it differs
    const errorAddress = "0x9e4c32d3f1e06cc56177438e46A478575462cb0b";
    if (bondDoc.distributorAddress?.toLowerCase() !== errorAddress.toLowerCase()) {
        console.warn(`⚠️ ERROR LOG ADDRESS MISMATCH! Error target: ${errorAddress}`);
    }
    else {
        console.log("✅ Error target matches DB Distributor.");
    }
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const distContract = new ethers_1.ethers.Contract(bondDoc.distributorAddress, [
        "function claimableYield(address) view returns (uint256)",
        "function cumulativeYieldPerToken() view returns (uint256)",
        "function userPaidPerToken(address) view returns (uint256)",
        "function rewards(address) view returns (uint256)",
        "function reserve() view returns (uint256)"
    ], provider);
    // Also check USDT balance of distributor
    const usdtContract = new ethers_1.ethers.Contract(config_1.config.contracts.usdtAddress, ["function balanceOf(address) view returns (uint256)"], provider);
    const distBalance = await usdtContract.balanceOf(bondDoc.distributorAddress);
    const reserve = await distContract.reserve();
    const claimable = await distContract.claimableYield(TARGET_USER);
    const cumulative = await distContract.cumulativeYieldPerToken();
    const paid = await distContract.userPaidPerToken(TARGET_USER);
    const currentReward = await distContract.rewards(TARGET_USER);
    console.log(`\n--- Stats for ${TARGET_USER} ---`);
    console.log(`Distributor Balance: ${ethers_1.ethers.formatUnits(distBalance, 6)} USDT`);
    console.log(`Internal Reserve:  ${ethers_1.ethers.formatUnits(reserve, 6)} USDT`);
    console.log(`Claimable Total: ${ethers_1.ethers.formatUnits(claimable, 6)} USDT`);
    console.log(`Cumulative YPT:  ${ethers_1.ethers.formatUnits(cumulative, 6)}`);
    console.log(`User Paid YPT:   ${ethers_1.ethers.formatUnits(paid, 6)}`);
    console.log(`Stored Rewards:  ${ethers_1.ethers.formatUnits(currentReward, 6)}`);
    if (claimable === 0n) {
        console.log("\n❌ NO YIELD TO CLAIM. The 'Distribute Rate' step was likely skipped.");
    }
    await mongoose_1.default.disconnect();
}
main();
