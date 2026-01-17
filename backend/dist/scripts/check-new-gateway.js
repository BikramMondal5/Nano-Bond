"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    // The new Gateway Address
    const gatewayAddr = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB";
    const usdtAddr = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
    console.log(`Checking Gateway: ${gatewayAddr}`);
    const GATEWAY_ABI = ["function usdc() view returns (address)"];
    const gateway = new ethers_1.ethers.Contract(gatewayAddr, GATEWAY_ABI, provider);
    try {
        const usdcOnChain = await gateway.usdc();
        console.log(`[On-Chain] Gateway.usdc(): ${usdcOnChain}`);
        if (usdcOnChain.toLowerCase() === usdtAddr.toLowerCase()) {
            console.log("✅ MATCH: Gateway is using Correct USDT.");
        }
        else {
            console.log("❌ MISMATCH: Gateway is using WRONG USDT!");
            console.log(`Expected: ${usdtAddr}`);
        }
    }
    catch (e) {
        console.error("Error:", e.message);
    }
}
main();
