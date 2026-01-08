"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("./config");
const BOND_ABI = [
    "function totalSupply() external view returns (uint256)",
    "function totalBackedValue() external view returns (uint256)"
];
async function main() {
    console.log("========== NATIONAL DEBT MONITOR ==========");
    // Connect to Network
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const bond = new ethers_1.ethers.Contract(config_1.config.contracts.bondAddress, BOND_ABI, provider);
    try {
        const supply = await bond.totalSupply();
        const backed = await bond.totalBackedValue();
        // Assuming 6 decimals like USDT/Bond
        const supplyFmt = ethers_1.ethers.formatUnits(supply, 6);
        const backedFmt = ethers_1.ethers.formatUnits(backed, 6);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`Total Debt Issued (Tokens): $${supplyFmt}`);
        console.log(`Total Asset Backing (Docs): $${backedFmt}`);
        if (supply <= backed) {
            console.log("STATUS: HEALTHY - 100% BACKED");
        }
        else {
            console.log("STATUS: WARNING - UNDERCOLLATERALIZED");
        }
        console.log("===========================================");
    }
    catch (error) {
        console.error("Failed to fetch debt data. Check params.", error);
    }
}
if (require.main === module) {
    main().catch(console.error);
}
