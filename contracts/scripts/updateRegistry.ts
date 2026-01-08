import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [signer] = await ethers.getSigners();
    
    const addressesPath = path.join(__dirname, "../deployed_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // Use proper ABI
    const sovereignBondABI = [
        "function setRegistry(address _registry) external"
    ];
    
    const bond = new ethers.Contract(
        addresses.SovereignBond,
        sovereignBondABI,
        signer
    );

    // Update registry address
    const tx = await bond.setRegistry(addresses.IdentityRegistryV2);
    await tx.wait();

    console.log("✅ Updated SovereignBond registry to V2:", addresses.IdentityRegistryV2);
}

main().catch(console.error);