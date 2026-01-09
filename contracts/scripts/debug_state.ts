import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Debugging State with:", deployer.address);

    const BOND_ADDRESS = "0x762e3159f2d7c3574bdf2dc8bbf16e9b41587a02";
    const USDT_ADDRESS = "0x6e91e688c279aae474244a95638c4b9b7db931c0";
    const TREASURY_ADDRESS = "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11";
    const TARGET_USER = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";

    const Bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const USDT = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
    const Treasury = await ethers.getContractAt("TreasurySwap", TREASURY_ADDRESS);

    // 1. Check Treasury Config
    const paymentToken = await Treasury.paymentToken();
    console.log(`Treasury uses Payment Token: ${paymentToken}`);
    if (paymentToken.toLowerCase() !== USDT_ADDRESS.toLowerCase()) {
        console.error(`MISMATCH! Script uses ${USDT_ADDRESS}, Treasury uses ${paymentToken}`);
        console.log("Please update your script or configs to match Treasury.");
    }

    // 2. Check User Bond Balance
    const userBondBalance = await Bond.balanceOf(TARGET_USER);
    console.log(`User (${TARGET_USER}) Bond Balance: ${ethers.formatUnits(userBondBalance, 18)} GBOND`);

    // 2. Check Treasury USDT Balance
    const treasuryUsdtBalance = await USDT.balanceOf(TREASURY_ADDRESS);
    console.log(`Treasury USDT Balance: ${ethers.formatUnits(treasuryUsdtBalance, 6)} USDT`);

    // 3. Check Maturity
    const maturity = await Bond.maturityDate();
    const now = Math.floor(Date.now() / 1000);
    console.log(`Bond Maturity: ${maturity} (Current: ${now}) -> Matured? ${now >= maturity}`);

    // Analysis
    if (userBondBalance < ethers.parseUnits("1000", 18)) {
        console.error("FAILURE CAUSE: User has insufficient bonds for 1000 GBOND redemption.");
    }
    if (treasuryUsdtBalance < ethers.parseUnits("1000", 6)) {
        console.error("FAILURE CAUSE: Treasury has insufficient USDT.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
