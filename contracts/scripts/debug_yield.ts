import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const addresses = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../deployed_addresses.json"), "utf-8")
    );

    const [deployer] = await ethers.getSigners();
    console.log("Analyzing with Account:", deployer.address);

    const bond = await ethers.getContractAt("SovereignBond", addresses.Bond);
    const distributor = await ethers.getContractAt("CouponDistributor", addresses.Distributor);
    const usdt = await ethers.getContractAt("MockUSDT", addresses.USDT);

    const totalSupply = await bond.totalSupply();
    const cumulativeYield = await distributor.cumulativeYieldPerToken();
    const distributorBalance = await usdt.balanceOf(addresses.Distributor);

    console.log(`\n--- System State ---`);
    console.log(`Bond Supply: ${ethers.formatUnits(totalSupply, 18)} GBOND`);
    console.log(`Distributor USDT Balance: ${ethers.formatUnits(distributorBalance, 6)} USDT`);
    console.log(`Cumulative Yield/Token: ${ethers.formatUnits(cumulativeYield, 18)}`);

    if (totalSupply === 0n) {
        console.error("CRITICAL: Total Supply is 0. DepositYield will FAIL.");
    } else {
        console.log("Supply OK.");
    }

    if (cumulativeYield === 0n) {
        console.error("CRITICAL: Cumulative Yield is 0. Claim will FAIL.");
    } else {
        console.log("Yield Distributed OK.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
