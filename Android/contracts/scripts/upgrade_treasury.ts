import { ethers } from "hardhat";
import fs from "fs";

// Load existing addresses (Mock fix, ideally read from deployed_addresses.json or contracts.ts)
// But for robustness, we will rely on strict knowns
const SOVEREIGN_BOND_ADDR = "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02";
const MOCK_USDT_ADDR = "0xfa472BdAa91C805eB6d664FEC24b0d355FDA2999";

async function main() {
    console.log("Starting Treasury Upgrade...");
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    // 1. Attach to Existing Bond
    const SovereignBond = await ethers.getContractFactory("SovereignBond");
    const bond = SovereignBond.attach(SOVEREIGN_BOND_ADDR) as any;

    // 2. Deploy NEW TreasurySwap
    console.log("Deploying separate TreasurySwap...");
    const TreasurySwap = await ethers.getContractFactory("TreasurySwap");
    const newTreasury = await TreasurySwap.deploy(MOCK_USDT_ADDR, SOVEREIGN_BOND_ADDR, deployer.address);
    await newTreasury.waitForDeployment();
    const newTreasuryAddr = await newTreasury.getAddress();
    console.log("NEW TreasurySwap deployed to:", newTreasuryAddr);

    // 3. Grant Roles
    console.log("Granting MINTER_ROLE to new Treasury...");
    const MINTER_ROLE = await bond.MINTER_ROLE();
    const tx = await bond.grantRole(MINTER_ROLE, newTreasuryAddr);
    await tx.wait();
    console.log("Role Granted successfully.");

    // 4. NOTE: We are NOT revoking old treasury role to avoid breaking pending things, but ideally we should.

    // 5. Output for manual update
    console.log("\n=================================================");
    console.log("UPGRADE COMPLETE");
    console.log("New Treasury Address:", newTreasuryAddr);

    fs.writeFileSync("treasury_address.txt", newTreasuryAddr);

    console.log("Please update 'lib/contracts.ts' and 'bond-registry.json'!");
    console.log("=================================================\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
