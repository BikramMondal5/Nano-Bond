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
    console.log("=== CHECKING BOND 7777785 ===");
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const bondDoc = await Bond_1.Bond.findOne({ bondId: "7777785" });
    if (!bondDoc) {
        console.error("Bond not found");
        return;
    }
    console.log(`Contract: ${bondDoc.contractAddress}`);
    console.log(`Treasury: ${bondDoc.treasuryAddress}`);
    console.log(`Distributor: ${bondDoc.distributorAddress}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    if (bondDoc.distributorAddress) {
        const distContract = new ethers_1.ethers.Contract(bondDoc.distributorAddress, ["function paymentToken() view returns (address)"], provider);
        const token = await distContract.paymentToken();
        const CORRECT = config_1.config.contracts.usdtAddress;
        console.log(`Distributor USDT: ${token}`);
        console.log(`Correct USDT:     ${CORRECT}`);
        if (token.toLowerCase() !== CORRECT.toLowerCase()) {
            console.log("❌ MISMATCH DETECTED! Bond needs repair.");
        }
        else {
            console.log("✅ Configuration looks correct.");
        }
    }
    await mongoose_1.default.disconnect();
}
main();
