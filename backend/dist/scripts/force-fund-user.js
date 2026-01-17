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
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const TARGET_WALLET = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    console.log(`Admin Address: ${adminWallet.address}`);
    const USDT_ADDRESS = config_1.config.contracts.usdtAddress;
    const usdtContract = new ethers_1.ethers.Contract(USDT_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function mint(address, uint256) external",
        "function transfer(address, uint256) external"
    ], adminWallet);
    const balance = await usdtContract.balanceOf(adminWallet.address);
    console.log(`Admin USDT Balance: ${ethers_1.ethers.formatUnits(balance, 6)}`);
    console.log("Attempting to MINT to Target...");
    try {
        const tx = await usdtContract.mint(TARGET_WALLET, 10000n * 1000000n); // 10k USDT
        await tx.wait();
        console.log("✅ Minted 10,000 USDT to Target.");
    }
    catch (e) {
        console.error("Mint failed:", e.message);
        console.log("Attempting Transfer instead...");
        try {
            const tx2 = await usdtContract.transfer(TARGET_WALLET, 1000n * 1000000n);
            await tx2.wait();
            console.log("✅ Transferred 1,000 USDT to Target.");
        }
        catch (e2) {
            console.error("Transfer failed:", e2.message);
        }
    }
}
main();
