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
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    const TARGET = "0x7628bcf891eCd0112EaA2fd23c14aFB583813777"; // Bond 7777785 Distributor
    const ADMIN_WALLET = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    console.log(`Checking Support on: ${TARGET}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // 1. Native Balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Admin Native Balance: ${ethers_1.ethers.formatEther(balance)} ETH`);
    if (balance === 0n) {
        console.warn("⚠️ CRITICAL: Admin has 0 ETH! Cannot send transactions.");
        return; // Cannot check further if no gas
    }
    // 2. Check adminClaim
    const distContract = new ethers_1.ethers.Contract(TARGET, [
        "function adminClaim(address) external",
        "function hasRole(bytes32, address) view returns (bool)"
    ], wallet);
    console.log("Simulating adminClaim...");
    try {
        // We use callStatic to simulate w/o spending gas OR just rely on error details
        await distContract.adminClaim.staticCall(ADMIN_WALLET);
        console.log("✅ adminClaim Supported and Succeeded (Dry Run)");
    }
    catch (e) {
        console.error("❌ adminClaim Failed/Missing:", e.shortMessage || e.message);
        if (e.message.includes("Unrecognized selector") || e.data === "0x") {
            console.log("-> IMPLICATION: Contract is OLD and missing 'adminClaim'. Needs Repair.");
        }
    }
}
main();
