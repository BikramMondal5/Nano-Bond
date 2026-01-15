import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
    const usdtAddress = process.env.USDT_ADDRESS;
    const treasuryAddress = process.env.TREASURY_SWAP_ADDRESS;
    const bondAddress = process.env.SOVEREIGN_BOND_ADDRESS;

    // User from the error log
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";

    const [admin] = await ethers.getSigners();
    console.log(`Checking state for user ${userAddress}...`);

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = MockUSDT.attach(usdtAddress!);

    const balance = await usdt.balanceOf(userAddress);
    console.log(`User USDT Balance: ${ethers.formatUnits(balance, 6)}`);

    // Check Treasury
    const TreasurySwap = await ethers.getContractFactory("TreasurySwap");
    const treasury = TreasurySwap.attach(treasuryAddress!);

    // Check Bond
    const SovereignBond = await ethers.getContractFactory("SovereignBond");
    const bond = SovereignBond.attach(bondAddress!);

    // Check if Treasury has Minter Role on Bond
    const MINTER_ROLE = await bond.MINTER_ROLE();
    const hasRole = await bond.hasRole(MINTER_ROLE, treasuryAddress!);
    console.log(`Treasury has Minter Role: ${hasRole}`);

    // Check Bond Limits
    const currentSupply = await bond.totalSupply();
    const cap = await bond.totalBackedValue(); // Assuming cap is backed value for now? Or check logic.
    console.log(`Bond Supply: ${ethers.formatUnits(currentSupply, 18)}`);
    console.log(`Bond Backed Value: ${ethers.formatUnits(cap, 18)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
