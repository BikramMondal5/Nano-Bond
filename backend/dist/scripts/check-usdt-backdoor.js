"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
async function main() {
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // Check the USDT address from Config (which might be 0xfa47...)
    const usdtAddressConfig = config_1.config.contracts.usdtAddress;
    console.log(`Checking Config USDT: ${usdtAddressConfig}`);
    await checkPermit(usdtAddressConfig, wallet);
    // Check the USDT address from deployed_addresses.json (0xF62f...)
    // Hardcoded for now based on what I saw
    const usdtAddressJson = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
    if (usdtAddressConfig.toLowerCase() !== usdtAddressJson.toLowerCase()) {
        console.log(`\nChecking JSON USDT: ${usdtAddressJson}`);
        await checkPermit(usdtAddressJson, wallet);
    }
}
async function checkPermit(address, wallet) {
    if (!address)
        return;
    // MockUSDT ABI with backdoor permit
    const USDT_ABI = [
        "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
        "function name() view returns (string)"
    ];
    const usdt = new ethers_1.ethers.Contract(address, USDT_ABI, wallet);
    try {
        const name = await usdt.name();
        console.log(`Token Name: ${name}`);
    }
    catch (e) {
        console.log("Could not fetch name (might not be a token)");
    }
    // Attempt Dummy Permit
    console.log("Attempting Dummy Permit...");
    const dummyV = 27;
    const dummyR = ethers_1.ethers.ZeroHash;
    const dummyS = ethers_1.ethers.ZeroHash;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    try {
        // We use dummy signature. 
        // If backdoor exists: Success (sets allowance).
        // If NO backdoor: Revert (InvalidSignature).
        const tx = await usdt.permit(wallet.address, wallet.address, 100, deadline, dummyV, dummyR, dummyS);
        console.log(`Permit Transactions SENT: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Permit SUCCEEDED! This USDT has the backdoor.");
    }
    catch (error) {
        console.log("❌ Permit FAILED!");
        if (error.message.includes("InvalidSignature") || error.message.includes("revert")) {
            console.log("Reason: Likely missing backdoor (Standard ERC20Permit).");
        }
        else {
            console.log("Error: " + error.message);
        }
    }
}
main();
