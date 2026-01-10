"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("./config");
// ABIs
const GATEWAY_ABI = ["function buyBondWithNative() external payable"];
const REGISTRY_ABI = ["function register(address user, bytes32 identity) external"];
const BOND_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function addAsset(string, uint256) external"
];
const USDT_ABI = [
    "function approve(address, uint256) external",
    "function balanceOf(address) view returns (uint256)"
];
const DISTRIBUTOR_ABI = [
    "function depositYield(uint256) external",
    "function claim() external"
];
async function main() {
    console.log("✈️  STARTING LIVE TEST FLIGHT (Mantle Sepolia) ✈️");
    // 1. Setup Admin (You)
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const admin = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // 2. Setup Test Pilot (New Citizen)
    const pilot = ethers_1.ethers.Wallet.createRandom().connect(provider);
    console.log(`👨‍✈️ Admin: ${admin.address}`);
    console.log(`👨‍🚀 Pilot: ${pilot.address}`);
    // Contracts
    const registry = new ethers_1.ethers.Contract(config_1.config.contracts.registryAddress, REGISTRY_ABI, admin);
    const bond = new ethers_1.ethers.Contract(config_1.config.contracts.bondAddress, BOND_ABI, admin);
    const gateway = new ethers_1.ethers.Contract(config_1.config.contracts.gatewayAddress, GATEWAY_ABI, pilot);
    const usdt = new ethers_1.ethers.Contract(config_1.config.contracts.usdtAddress, USDT_ABI, admin);
    const distributor = new ethers_1.ethers.Contract(config_1.config.contracts.distributorAddress, DISTRIBUTOR_ABI, admin);
    const pilotDistributor = new ethers_1.ethers.Contract(config_1.config.contracts.distributorAddress, ["function claim() external"], pilot);
    try {
        // A. Register Pilot
        console.log("\n1️⃣  Registering Pilot Identity...");
        const idHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes("PILOT-" + Date.now()));
        const regTx = await registry.register(pilot.address, idHash);
        await regTx.wait();
        console.log("✅ Pilot Registered.");
        // B. Add Asset Backing (If needed)
        console.log("\n2️⃣  Verifying Asset Backing...");
        const backTx = await bond.addAsset("ipfs://test-flight-doc", 10000000000);
        await backTx.wait();
        console.log("✅ Asset Cap Increased.");
        // C. Fund Pilot with MNT
        console.log("\n3️⃣  Funding Pilot with 0.1 MNT (Gas)...");
        const fundTx = await admin.sendTransaction({
            to: pilot.address,
            value: ethers_1.ethers.parseEther("0.1")
        });
        await fundTx.wait();
        console.log("✅ Pilot Funded.");
        // D. Pilot Buys Bond
        console.log("\n4️⃣  Pilot Buying Bond (Simulating Zap)...");
        const buyTx = await gateway.buyBondWithNative({ value: 1000000n });
        await buyTx.wait();
        console.log("✅ Purchase Complete!");
        // E. Verify Balance
        const balance = await bond.balanceOf(pilot.address);
        console.log(`\n🎉 Pilot Bond Balance: ${balance.toString()} GBOND`);
        if (balance > 0n) {
            console.log("🚀 Purchase Succesful. Now testing Yield...");
        }
        // F. Distribute Yield (Interest)
        console.log("\n5️⃣  Distributing Yield (10 USDT)...");
        // Approve & Deposit
        const yieldAmount = 10000000n; // 10 USDT
        const approveTx = await usdt.approve(config_1.config.contracts.distributorAddress, yieldAmount);
        await approveTx.wait();
        const depositTx = await distributor.depositYield(yieldAmount);
        await depositTx.wait();
        console.log("✅ Yield Deposited.");
        // G. Pilot Claims Yield
        console.log("\n6️⃣  Pilot Claiming Yield...");
        // This tx sends MNT gas cost
        const claimTx = await pilotDistributor.claim();
        await claimTx.wait();
        console.log("✅ Yield Claimed.");
        // H. Verify Pilot USDT Balance
        const pilotUsdt = new ethers_1.ethers.Contract(config_1.config.contracts.usdtAddress, USDT_ABI, admin);
        const pilotBal = await pilotUsdt.balanceOf(pilot.address);
        console.log(`\n💰 Pilot USDT Balance: ${ethers_1.ethers.formatUnits(pilotBal, 6)} USDT`);
        if (pilotBal > 0n) {
            console.log("🚀 FULL TEST FLIGHT SUCCESSFUL (Buy + Earn) 🚀");
        }
    }
    catch (e) {
        console.error("💥 Test Flight Crashed:", e.message);
        console.error(e);
    }
}
main().catch(console.error);
