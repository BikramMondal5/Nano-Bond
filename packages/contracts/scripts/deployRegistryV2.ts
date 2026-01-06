import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying IdentityRegistryV2 with:", deployer.address);

    const IdentityRegistryV2 = await ethers.getContractFactory("IdentityRegistryV2");
    const registry = await IdentityRegistryV2.deploy(deployer.address);
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log("✅ IdentityRegistryV2 deployed to:", address);

    // Update deployed addresses
    const addressesPath = path.join(__dirname, "../deployed_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    addresses.IdentityRegistryV2 = address;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

    console.log("✅ Updated deployed_addresses.json");
}

main().catch(console.error);