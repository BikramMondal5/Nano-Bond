import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Debug: Analysis Linkage/Permission for BUY Failure");

    const addresses = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../deployed_addresses.json"), "utf-8")
    );

    const [deployer] = await ethers.getSigners();
    console.log("Signer:", deployer.address);

    const bond: any = await ethers.getContractAt("SovereignBond", addresses.Bond);
    const registry = await ethers.getContractAt("IdentityRegistry", addresses.Registry);
    const treasury = await ethers.getContractAt("TreasurySwap", addresses.Treasury);
    const usdt = await ethers.getContractAt("MockUSDT", addresses.USDT);

    // 1. Identity Check
    const isVerified = await registry.isVerified(deployer.address);
    console.log(`Identity Verified (Deployer): ${isVerified}`);
    if (!isVerified) {
        console.log("Attempting to self-register...");
        await registry.register(deployer.address, ethers.id("DEBUG_ID"));
        console.log("Registered.");
    }

    // 2. Minter Role Check
    const MINTER_ROLE = await bond.MINTER_ROLE();
    const hasRole = await bond.hasRole(MINTER_ROLE, addresses.Treasury);
    console.log(`Treasury has MINTER_ROLE: ${hasRole}`);

    // 3. Distributor Hook Check (Linkage)
    // 4. Backing Validity Check
    const totalBacked = await bond.totalBackedValue();
    const supply = await bond.totalSupply();
    console.log(`Backed Value: ${ethers.formatEther(totalBacked)}`);
    console.log(`Current Supply: ${ethers.formatEther(supply)}`);

    if (totalBacked === 0n) {
        console.warn("WARNING: Backed Value is 0! Minting will fail.");
        console.log("Seeding Initial Asset...");
        const tx = await bond.addAsset("https://example.com/initial_backing.pdf", ethers.parseUnits("1000000", 18));
        await tx.wait();
        console.log("Asset Added. Backing Increased to 1M.");
    }

    // 5. Simulate Buy
    const amount = ethers.parseUnits("10", 6); // 10 USDT

    // Approve
    console.log("Approving USDT...");
    await usdt.approve(addresses.Treasury, amount);

    // Buy
    console.log("Attempting Buy (10 USDT)...");
    try {
        const tx = await treasury.buy(amount);
        console.log("Buy TX Sent:", tx.hash);
        await tx.wait();
        console.log("Buy Successful!");
    } catch (e: any) {
        console.error("BUY FAILED!");
        if (e.data) {
            console.error("Revert Data:", e.data);
            // Try to decode common errors?
        } else {
            console.error(e);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
