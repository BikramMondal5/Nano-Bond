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
// Load .env explicitly to be safe
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("Checking Bond 123456...");
    if (!process.env.MONGODB_URI) {
        console.error("Missing MONGODB_URI");
        return;
    }
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const bond = await Bond_1.Bond.findOne({ bondId: '123456' });
    if (!bond) {
        console.log("Bond 123456 NOT FOUND in DB.");
    }
    else {
        console.log(`Bond ID: ${bond.bondId}`);
        console.log(`Contract: ${bond.contractAddress}`);
        console.log(`Treasury: ${bond.treasuryAddress}`);
        const suspect = "0xbe6987a75e31dd7ee208349d7404da7d3e066db6";
        if (bond.treasuryAddress?.toLowerCase() === suspect.toLowerCase()) {
            console.log("MATCH! The error spender IS the Treasury.");
            // Check Payment Token
            const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
            const treasury = new ethers_1.ethers.Contract(bond.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
            try {
                const token = await treasury.paymentToken();
                console.log(`Treasury USDT: ${token}`);
                console.log(`Config USDT:   ${config_1.config.contracts.usdtAddress}`);
                if (token.toLowerCase() !== config_1.config.contracts.usdtAddress.toLowerCase()) {
                    console.error("❌ CRITICAL: Treasury uses WRONG USDT!");
                    console.log("This causes 'Insufficient Allowance' because Gateway approves Correct USDT, but Treasury pulls Wrong USDT.");
                }
                else {
                    console.log("✅ Treasury uses Correct USDT.");
                }
            }
            catch (e) {
                console.error("Error reading paymentToken:", e.message);
            }
        }
        else {
            console.log("NO MATCH. The error spender is NOT the Treasury.");
            console.log(`Error Spender: ${suspect}`);
        }
    }
    await mongoose_1.default.disconnect();
}
main();
