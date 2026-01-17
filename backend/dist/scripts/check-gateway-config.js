"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const GATEWAY_ABI = ["function usdc() view returns (address)"];
    // Configured Gateway Address
    const gatewayAddr = config_1.config.contracts.gatewayAddress;
    try {
        const gateway = new ethers_1.ethers.Contract(gatewayAddr, GATEWAY_ABI, provider);
        const usdcOnChain = await gateway.usdc();
        console.log("GATEWAY_ADDR=" + gatewayAddr);
        console.log("GATEWAY_USDC_ONCHAIN=" + usdcOnChain);
        console.log("CONFIG_USDT_ADDR=" + config_1.config.contracts.usdtAddress);
        if (usdcOnChain.toLowerCase() !== config_1.config.contracts.usdtAddress.toLowerCase()) {
            console.log("MISMATCH_DETECTED");
        }
        else {
            console.log("MATCH_CONFIRMED");
        }
    }
    catch (e) {
        console.log("ERROR=" + e.message);
    }
}
main();
