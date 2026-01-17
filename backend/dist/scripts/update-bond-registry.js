"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const bondAddress = config_1.config.contracts.bondAddress;
    const configRegistry = config_1.config.contracts.registryAddress;
    console.log(`Bond: ${bondAddress}`);
    console.log(`Setting Registry to: ${configRegistry}`);
    const bond = new ethers_1.ethers.Contract(bondAddress, ["function setRegistry(address) external"], wallet);
    try {
        const tx = await bond.setRegistry(configRegistry);
        console.log(`TX Sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Registry Updated Successfully!");
    }
    catch (e) {
        console.error("Update failed:", e.message);
    }
}
main();
