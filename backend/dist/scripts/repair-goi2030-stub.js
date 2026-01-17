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
const fs_1 = __importDefault(require("fs"));
// Load .env
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
// ABI Constants
const TREASURY_ABI = [
    "constructor(address,address,address)",
    "function grantRole(bytes32, address) external"
];
const DISTRIBUTOR_ABI = [
    "constructor(address,address,address)",
    "function grantRole(bytes32, address) external"
];
const BOND_ABI = [
    "function grantRole(bytes32, address) external",
    "function hasRole(bytes32, address) view returns (bool)"
];
async function main() {
    console.log("=== REPAIRING GOI-2030 ===");
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const BOND_ID = "GOI-2030";
    const bondDoc = await Bond_1.Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) {
        console.error("Bond not found");
        return;
    }
    console.log(`Current Bond Address: ${bondDoc.contractAddress}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const TARGET_ADMIN = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    // 1. Deploy New Treasury (Correct USDT)
    // Args: _paymentToken, _bond, _admin
    // Note: Treasury constructor args might differ. Checking TreasurySwap.sol...
    // constructor(address _paymentToken, address _bond, address admin)
    const CORRECT_USDT = config_1.config.contracts.usdtAddress; // 0xF62f...
    console.log("Deploying New Treasury...");
    const TreasuryFactory = new ethers_1.ethers.ContractFactory(TREASURY_ABI, fs_1.default.readFileSync(path_1.default.join(__dirname, '../../contracts/artifacts/contracts/TreasurySwap.sol/TreasurySwap.json')).toString(), wallet);
    // Wait, reading artifact JSON manually is brittle. accessing ABI/Bytecode is better.
    // I'll assume artifacts are in `contracts/artifacts/...`
}
// Aborting manual script write to use standard check first.
