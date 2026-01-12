import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script to deploy a NEW Bond Product with its own isolated infrastructure.
 * Reuses: Shared USDT, Shared Registry, Shared Gateway (via config).
 * Deploys: New Bond Token, New Treasury, New Distributor.
 * 
 * Usage: npx hardhat run scripts/deploy_new_bond_product.ts --network localhost
 */
async function main() {
    console.log("🚀 Deploying NEW Bond Product Infrastructure...");

    const [deployer] = await ethers.getSigners();
    console.log("Admin Account:", deployer.address);

    // 1. Load Shared Core Addresses (MUST be in .env)
    const USDT_ADDRESS = process.env.USDT_ADDRESS;
    const REGISTRY_ADDRESS = process.env.IDENTITY_REGISTRY_ADDRESS;

    if (!USDT_ADDRESS || !REGISTRY_ADDRESS) {
        throw new Error("Missing USDT_ADDRESS or IDENTITY_REGISTRY_ADDRESS in .env");
    }
    console.log("✅ Using Shared USDT:", USDT_ADDRESS);
    console.log("✅ Using Shared Registry:", REGISTRY_ADDRESS);

    // ---------------------------------------------------------
    // CHANGE THESE FOR THE NEW BOND
    // ---------------------------------------------------------
    const BOND_NAME = "Maha Metro Bond 2028";
    const BOND_SYMBOL = "MMB28";
    // ---------------------------------------------------------

    // 2. Deploy Unique SovereignBond Token
    console.log(`\nDeploying Bond Token [${BOND_NAME}]...`);
    const SovereignBond = await ethers.getContractFactory("SovereignBond");
    const bond = await SovereignBond.deploy(BOND_NAME, BOND_SYMBOL, REGISTRY_ADDRESS, deployer.address);
    await bond.waitForDeployment();
    const bondAddress = await bond.getAddress();
    console.log(`✨ Bond Deployed: ${bondAddress}`);

    // 3. Deploy Unique Treasury (The Vault for this Bond)
    console.log("\nDeploying Isolated Treasury...");
    const TreasurySwap = await ethers.getContractFactory("TreasurySwap");
    const treasury = await TreasurySwap.deploy(USDT_ADDRESS, bondAddress, deployer.address);
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log(`✨ Treasury Deployed: ${treasuryAddress}`);

    // 4. Deploy Unique CouponDistributor (Yield Payer for this Bond)
    console.log("\nDeploying Isolated Distributor...");
    const CouponDistributor = await ethers.getContractFactory("CouponDistributor");
    const distributor = await CouponDistributor.deploy(USDT_ADDRESS, bondAddress, deployer.address);
    await distributor.waitForDeployment();
    const distributorAddress = await distributor.getAddress();
    console.log(`✨ Distributor Deployed: ${distributorAddress}`);

    // 5. Link Contracts (Grant Minter Role)
    console.log("\nLinking Contracts...");
    const MINTER_ROLE = await bond.MINTER_ROLE();
    const tx = await bond.grantRole(MINTER_ROLE, treasuryAddress);
    await tx.wait();
    console.log("✅ Treasury granted MINTER_ROLE on Bond");

    console.log("\n=================================================");
    console.log("🎉 NEW BOND PRODUCT DEPLOYED SUCCESSFULLY");
    console.log("=================================================");
    console.log(`Name:        ${BOND_NAME}`);
    console.log(`Symbol:      ${BOND_SYMBOL}`);
    console.log("-------------------------------------------------");
    console.log(`Bond Token:  ${bondAddress}`);
    console.log(`Treasury:    ${treasuryAddress}`);
    console.log(`Distributor: ${distributorAddress}`);
    console.log("-------------------------------------------------");
    console.log("👉 NEXT STEP: Add these 3 addresses to your DB/Admin Panel for this Bond ID.");
    console.log("=================================================\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
