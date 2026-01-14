import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Distributor Upgrade with:", deployer.address);

    // Existing Contract Addresses
    // We need to link the NEW distributor to the EXISTING Bond and USDT
    // Bond: 0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02 (GOI-2030)
    // USDT: 0x6e91E688c279aae474244a95638c4b9B7db931C0 (MockUSDT)

    // NOTE: Check your own config or contracts.ts for these values if they differ. 
    // I am using the previously seen values.
    const BOND_ADDRESS = "0x762e3159f2d7c3574bdf2dc8bbf16e9b41587a02";
    const USDT_ADDRESS = "0xfa472BdAa91C805eB6d664FEC24b0d355FDA2999";

    const Distributor = await ethers.getContractFactory("CouponDistributor");
    const distributor = await Distributor.deploy(
        USDT_ADDRESS,
        BOND_ADDRESS,
        deployer.address
    );

    await distributor.waitForDeployment();
    const address = await distributor.getAddress();
    console.log("New CouponDistributor Deployed to:", address);

    // Save address
    fs.writeFileSync(path.join(__dirname, "../distributor_address.txt"), address);

    // Note: We might need to permit this new distributor to interact?
    // CouponDistributor is mostly passive, but the Bond might notify it?
    // Checking SovereignBond.sol: It calls `distributor.onTokenTransfer`.
    // The Bond has a `setDistributor` function? 
    // Yes: function setDistributor(address _distributor) external onlyRole(DEFAULT_ADMIN_ROLE)

    console.log("Updating Bond with new Distributor...");
    const Bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const tx = await Bond.setDistributor(address);
    await tx.wait();
    console.log("Bond distributor updated successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
