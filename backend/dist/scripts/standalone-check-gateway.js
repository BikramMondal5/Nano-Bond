"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env manually
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv_1.default.config({ path: envPath });
async function main() {
    const rpcUrl = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
    const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    // Addresses
    const gatewayAddr = process.env.SWAP_GATEWAY_ADDRESS; // Or from deployed_addresses
    const usdtAddr = process.env.USDT_ADDRESS;
    console.log(`RPC: ${rpcUrl}`);
    console.log(`Config Gateway: ${gatewayAddr}`);
    console.log(`Config USDT: ${usdtAddr}`);
    if (!gatewayAddr) {
        console.error("Gateway Address missing in .env");
        // Try fallback hardcoded based on previous findings 
        // Gateway: 0x7c81FfcAcc41adBC0E08d206e96B0e7008bb1111
    }
    const GATEWAY_ABI = ["function usdc() view returns (address)"];
    // Use what we have
    const targetGateway = gatewayAddr || "0x7c81FfcAcc41adBC0E08d206e96B0e7008bb1111";
    console.log(`Checking Gateway at: ${targetGateway}`);
    const gateway = new ethers_1.ethers.Contract(targetGateway, GATEWAY_ABI, provider);
    try {
        const usdcOnChain = await gateway.usdc();
        console.log(`[ON-CHAIN] Gateway.usdc() = ${usdcOnChain}`);
        if (usdtAddr && usdcOnChain.toLowerCase() !== usdtAddr.toLowerCase()) {
            console.log("❌ CRITICAL MISMATCH: Gateway is pointing to WRONG USDT.");
            console.log("Solution: We must REDEPLOY InvestmentGateway with the correct USDT address.");
        }
        else {
            console.log("✅ MATCH: Gateway config looks correct.");
        }
    }
    catch (e) {
        console.error("Error calling usdc():", e);
    }
}
main();
