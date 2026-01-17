"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    const BOND_ABI = [
        "function registry() view returns (address)",
        "function assets(uint256) view returns (string, uint256, uint256)",
        "function totalBackedValue() view returns (uint256)",
        "function totalSupply() view returns (uint256)"
    ];
    const REGISTRY_ABI = [
        "function isVerified(address) view returns (bool)"
    ];
    const bondAddress = config_1.config.contracts.bondAddress;
    if (!bondAddress) {
        console.error("Bond Address missing in config");
        return;
    }
    console.log(`Bond Address: ${bondAddress}`);
    const bond = new ethers_1.ethers.Contract(bondAddress, BOND_ABI, provider);
    try {
        const registryAddress = await bond.registry();
        console.log(`Registry Address (from Bond): ${registryAddress}`);
        const registry = new ethers_1.ethers.Contract(registryAddress, REGISTRY_ABI, provider);
        const isVerified = await registry.isVerified(userAddress);
        console.log(`User ${userAddress} isVerified: ${isVerified}`);
        if (!isVerified) {
            console.log("❌ FAILURE REASON: User is not verified. Investment will revert.");
        }
        else {
            console.log("✅ User is verified. 'NotVerified' error should not happen.");
        }
    }
    catch (e) {
        console.error("Error:", e);
    }
}
main();
