"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const bondAddress = config_1.config.contracts.bondAddress;
    // 1. Get Bond's Registry
    const bond = new ethers_1.ethers.Contract(bondAddress, ["function registry() view returns (address)"], provider);
    const bondRegistry = await bond.registry();
    // 2. Get Config Registry
    const configRegistry = config_1.config.contracts.registryAddress;
    console.log(`Bond Registry:   ${bondRegistry}`);
    console.log(`Config Registry: ${configRegistry}`);
    if (bondRegistry.toLowerCase() !== configRegistry.toLowerCase()) {
        console.log("❌ MISMATCH DETECTED!");
        console.log("The Bond is pointing to a DIFFERENT Registry than the Config.");
        console.log("Solution: Call bond.setRegistry(configRegistry).");
    }
    else {
        console.log("✅ Registry Addresses MATCH.");
    }
}
main();
