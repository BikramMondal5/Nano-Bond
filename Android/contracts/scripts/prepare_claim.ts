import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Preparing Claim environment with:", deployer.address);

    const USDT_ADDRESS = "0x6e91e688c279aae474244a95638c4b9b7db931c0";
    // New Distributor Address from previous step
    const DISTRIBUTOR_ADDRESS = "0xf99850Cd283cCdb3686997A0e4d929207976fa2C";

    const USDT = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
    const Distributor = await ethers.getContractAt("CouponDistributor", DISTRIBUTOR_ADDRESS);

    // 1. Mint USDT to Admin (for distribution)
    console.log("Minting 10,000 USDT to Admin...");
    await (await USDT.mint(deployer.address, ethers.parseUnits("10000", 6))).wait();

    const BOND_ADDRESS = "0x762e3159f2d7c3574bdf2dc8bbf16e9b41587a02";
    const TREASURY_ADDRESS = "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11";
    const Bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const Treasury = await ethers.getContractAt("TreasurySwap", TREASURY_ADDRESS);

    // Check Bond Supply
    const supply = await Bond.totalSupply();
    console.log(`Current Bond Supply: ${ethers.formatUnits(supply, 18)} GBOND`);

    if (supply == 0n) {
        console.log("Supply is 0. Minting bonds to Admin to enable distribution...");

        // 1. Approve Treasury to spend Admin's USDT? No, adminMint uses no payment (gasless logic) or buy uses payment.
        // Let's use 'adminMint' if available?
        // Treasury has adminMint.
        await (await Treasury.adminMint(deployer.address, ethers.parseUnits("1000", 6))).wait();
        console.log("Minted 1000 GBOND to Admin.");
    }

    // Verify Distributor Config
    const distToken = await Distributor.paymentToken();
    console.log(`Distributor thinks Payment Token is: ${distToken}`);
    if (distToken.toLowerCase() !== USDT_ADDRESS.toLowerCase()) {
        console.error("MISMATCH! Distributor is using different token.");
        return;
    }

    // Check Allowance
    const allowance = await USDT.allowance(deployer.address, DISTRIBUTOR_ADDRESS);
    console.log(`Allowance: ${ethers.formatUnits(allowance, 6)} USDT`);

    // 3. Deposit Yield (Try smaller amount)
    console.log("Depositing 10 USDT Yield...");
    try {
        await (await Distributor.depositYield(ethers.parseUnits("10", 6))).wait();
        console.log("Yield distributed successfully.");
    } catch (e: any) {
        console.error("Deposit Failed:", e.message);
        // Try to decode if possible, but hardhat usually shows reason
    }

    console.log("Yield distributed. Holders should now have claimable amounts.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
