"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // User to verify (from logs)
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    // 1. Get Registry Address from Config or Bond
    const registryAddress = config_1.config.contracts.registryAddress;
    console.log(`Registry Address: ${registryAddress}`);
    // Registry ABI
    const REGISTRY_ABI = [
        "function registerIdentity(address user, uint16 country) external",
        "function isVerified(address) view returns (bool)"
    ];
    const registry = new ethers_1.ethers.Contract(registryAddress, REGISTRY_ABI, wallet);
    try {
        const isVerifiedBefore = await registry.isVerified(userAddress);
        if (isVerifiedBefore) {
            console.log("User is already verified!");
            return;
        }
        console.log(`Verifying user ${userAddress}...`);
        // Country code 356 (India) or 840 (USA) - using 356 as placeholder
        const tx = await registry.registerIdentity(userAddress, 356);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ User Verified Successfully!");
    }
    catch (e) {
        console.error("Verification failed:", e.message);
    }
}
main();
