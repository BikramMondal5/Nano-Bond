"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("./config");
const bybit_service_1 = require("./services/bybit.service");
// Minimal ABIs
const DISTRIBUTOR_ABI = [
    "function depositYield(uint256 amount) external",
];
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];
async function main() {
    console.log("Starting Yield Bot (DPI Mode)...");
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const distributor = new ethers_1.ethers.Contract(config_1.config.contracts.distributorAddress, DISTRIBUTOR_ABI, wallet);
    const usdt = new ethers_1.ethers.Contract(config_1.config.contracts.usdtAddress, ERC20_ABI, wallet);
    const bybit = new bybit_service_1.BybitService();
    // 1. Check Market Conditions via Bybit
    const ethPrice = await bybit.getPrice('ETHUSDT');
    if (ethPrice === 0) {
        console.log("Market data unavailable, skipping yield distribution.");
        return;
    }
    // 2. Calculate Yield to Distribute
    // Mock logic: Pay 10 USDT yield
    const yieldAmount = ethers_1.ethers.parseUnits("10", 6); // Assuming USDT is 6 decimals
    console.log(`Preparing to distribute ${ethers_1.ethers.formatUnits(yieldAmount, 6)} USDT yield...`);
    // 3. Approve Distributor to spend USDT
    try {
        console.log("Approving USDT...");
        const approveTx = await usdt.approve(config_1.config.contracts.distributorAddress, yieldAmount);
        await approveTx.wait();
        console.log("USDT Approved.");
        // 4. Call depositYield
        console.log("Calling depositYield...");
        const tx = await distributor.depositYield(yieldAmount);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("Yield distributed successfully!");
    }
    catch (error) {
        console.error("Error distributing yield:", error);
    }
}
if (require.main === module) {
    main().catch(console.error);
}
