import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Seeding Asset Backing...");

    const addresses = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../deployed_addresses.json"), "utf-8")
    );

    const [deployer] = await ethers.getSigners();
    // const bond = await ethers.getContractAt("SovereignBond", addresses.Bond);

    const BondFactory = await ethers.getContractFactory("SovereignBond");
    const bond: any = BondFactory.attach(addresses.Bond);

    console.log("Adding Asset...");
    // 1M USDT value
    const tx = await bond.addAsset("https://example.com/seed.pdf", ethers.parseUnits("1000000", 18));
    console.log("Tx Sent:", tx.hash);
    await tx.wait();
    console.log("Asset Added Successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
