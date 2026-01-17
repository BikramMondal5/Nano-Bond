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
// Known Errors
const ERRORS = {
    "0xb12c8f91": "NotVerified",
    "0xfb8f41b2": "ERC20InsufficientAllowance",
    "0xe51025e4": "ExceedsBackedLogic", // Calculated guess, will verify or use hash
    // We can calculate on the fly
};
async function main() {
    console.log("Debugging Investment Error...");
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    // Get LATEST bond
    const bond = await Bond_1.Bond.findOne({}).sort({ createdAt: -1 });
    if (!bond) {
        console.log("No bonds.");
        return;
    }
    console.log(`Testing Bond: ${bond.bondName}`);
    console.log(`Address: ${bond.contractAddress}`);
    console.log(`Treasury: ${bond.treasuryAddress}`);
    // Checks
    const bondContract = new ethers_1.ethers.Contract(bond.contractAddress, [
        "function totalBackedValue() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function registry() view returns (address)"
    ], provider);
    const backed = await bondContract.totalBackedValue();
    const supply = await bondContract.totalSupply();
    const registry = await bondContract.registry();
    console.log(`Backed: ${backed}, Supply: ${supply}`);
    console.log(`Registry: ${registry}`);
    if (backed == 0n) {
        console.log("⚠️ WARNING: Bond has 0 Backing. 'ExceedsBackedLogic' is likely.");
    }
    // Identify Error Selector from User Input or Log
    // User provided: 0xb12c8f91 (NotVerified) in previous logs.
    // If they get it NOW, it means they are using an OLD bond (since new code doesn't have it?)
    // Wait, if we RECOMPILED, the new bytecode DOES NOT have the check.
    // But the OLD bond deployed on chain DOES.
    // We can't easily reproduce the "Gateway error" without calling it, 
    // but the state analysis above is strong enough.
    mongoose_1.default.disconnect();
}
main();
