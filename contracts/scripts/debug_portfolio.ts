import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
import path from "path";
dotenvConfig();

async function main() {
    // 1. Load Registry
    // We are running from 'contracts' dir, so path to registry is ../backend/bond-registry.json
    const registryPath = path.join(__dirname, "../../backend/bond-registry.json");
    console.log("Loading registry from:", registryPath);

    const data = fs.readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(data).bonds;

    const userAddress = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8"; // From user request
    const provider = ethers.provider;

    console.log(`Checking portfolio for user: ${userAddress}`);
    console.log(`Found ${registry.length} bonds in registry.`);

    for (const bond of registry) {
        console.log(`\nChecking Bond: ${bond.bondId} (${bond.bondName})`);

        if (!bond.contractAddress) {
            console.log("❌ Missing contractAddress in registry! Backend skips this.");
            continue;
        }

        console.log("Contract:", bond.contractAddress);
        try {
            const contract = await ethers.getContractAt("SovereignBond", bond.contractAddress);
            const balance = await contract.balanceOf(userAddress);
            console.log(`✅ Balance: ${ethers.formatUnits(balance, 18)} GBOND`);
        } catch (error: any) {
            console.log("❌ Failed to fetch balance:", error.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
