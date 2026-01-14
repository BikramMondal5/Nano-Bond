import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Fixing System State with:", deployer.address);

    const BOND_ADDRESS = "0x762e3159f2d7c3574bdf2dc8bbf16e9b41587a02";
    // CORRECT USDT
    const USDT_ADDRESS = "0xfa472BdAa91C805eB6d664FEC24b0d355FDA2999";
    const TREASURY_ADDRESS = "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11";
    const DISTRIBUTOR_ADDRESS = "0xf99850Cd283cCdb3686997A0e4d929207976fa2C";

    const Bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const Treasury = await ethers.getContractAt("TreasurySwap", TREASURY_ADDRESS);
    // Use MockUSDT ABI
    const USDT = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
    const Distributor = await ethers.getContractAt("CouponDistributor", DISTRIBUTOR_ADDRESS);

    // 1. Verify Treasury Config
    const tToken = await Treasury.paymentToken();
    if (tToken.toLowerCase() !== USDT_ADDRESS.toLowerCase()) {
        throw new Error(`Treasury Mismatch! Uses ${tToken}`);
    }

    // 2. Fund Treasury
    console.log("Funding Treasury with 1,000,000 USDT...");
    try {
        await (await USDT.mint(TREASURY_ADDRESS, ethers.parseUnits("1000000", 6))).wait();
        console.log("Treasury Funded.");
    } catch (e: any) {
        console.log("Minting failed, trying transfer...", e.message);
        // Try transfer from deployer?
        await (await USDT.transfer(TREASURY_ADDRESS, ethers.parseUnits("1000000", 6))).wait();
    }

    // 3. Fund Distributor (For Claims)
    console.log("Funding Distributor...");
    try {
        // Mint to Admin first
        await (await USDT.mint(deployer.address, ethers.parseUnits("10000", 6))).wait();
        // Approve
        await (await USDT.approve(DISTRIBUTOR_ADDRESS, ethers.parseUnits("10000", 6))).wait();
        // Deposit
        await (await Distributor.depositYield(ethers.parseUnits("10000", 6))).wait();
        console.log("Distributor Funded.");
    } catch (e: any) {
        console.log("Distributor Funding failed:", e.message);
    }

    // 4. Set Maturity (Ensure it's past)
    console.log("Setting Bond Maturity to yesterday...");
    const yesterday = Math.floor(Date.now() / 1000) - 86400;
    await (await Bond.setMaturityDate(yesterday)).wait();
    console.log("Maturity Updated.");

    // 5. Check Treasury Balance
    const balance = await USDT.balanceOf(TREASURY_ADDRESS);
    console.log(`Treasury Balance: ${ethers.formatUnits(balance, 6)} USDT`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
