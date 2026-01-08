"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("./config");
const VAULT_ABI = [
    "function setMatured(bool status) external",
    "function isMatured() external view returns (bool)"
];
async function main() {
    console.log("Starting Maturity Worker...");
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const vault = new ethers_1.ethers.Contract(config_1.config.contracts.vaultAddress, VAULT_ABI, wallet);
    // Check if current date > Maturity Date (Mocked check)
    const MATURITY_DATE = new Date("2025-12-31").getTime();
    const now = Date.now();
    if (now > MATURITY_DATE) {
        const isMatured = await vault.isMatured();
        if (!isMatured) {
            console.log("Bond reached maturity! Setting matured state...");
            const tx = await vault.setMatured(true);
            await tx.wait();
            console.log("Bond set to Matured. Deposits locked, Redemptions enabled.");
        }
        else {
            console.log("Bond already matured.");
        }
    }
    else {
        console.log("Bond not yet matured.");
    }
}
if (require.main === module) {
    main().catch(console.error);
}
