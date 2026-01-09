import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Preparing Redemption environment with:", deployer.address);

    const BOND_ADDRESS = "0x762e3159f2d7c3574bdf2dc8bbf16e9b41587a02";
    const USDT_ADDRESS = "0x6e91e688c279aae474244a95638c4b9b7db931c0";
    const TREASURY_ADDRESS = "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11";

    const Bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const USDT = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);

    // 1. Fund Treasury
    console.log("Funding Treasury with 1,000,000 USDT...");
    // Check if we can mint? Deployer should have minter role if it deployed USDT?
    // If not, we might need to assume we can mint or transfer.
    // The faucet API works so deployer has role.
    const fundTx = await USDT.mint(TREASURY_ADDRESS, ethers.parseUnits("1000000", 6));
    await fundTx.wait();
    console.log("Treasury funded.");

    // 2. Set Maturity to Yesterday
    console.log("Setting Bond Maturity to yesterday...");
    const yesterday = Math.floor(Date.now() / 1000) - 86400;
    const maturityTx = await Bond.setMaturityDate(yesterday);
    await maturityTx.wait();
    console.log(`Bond Maturity updated to timestamp: ${yesterday}`);

    console.log("Environment ready for Redemption.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
