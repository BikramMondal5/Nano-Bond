import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Verifying AdminRedeem with:", deployer.address);

    const BOND_ADDRESS = "0x762e3159f2d7c3574bdf2dc8bbf16e9b41587a02";
    const USDT_ADDRESS = "0x6e91e688c279aae474244a95638c4b9b7db931c0";
    const TREASURY_ADDRESS = "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11";
    // Need Registry info from Bond? Bond has public registry()

    // 1. Setup Contracts
    const Bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const USDT = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
    const Treasury = await ethers.getContractAt("TreasurySwap", TREASURY_ADDRESS);

    // Get Registry
    const registryAddr = await Bond.registry();
    console.log("Identity Registry:", registryAddr);
    // IdentityRegistryV2 ABI
    const Registry = await ethers.getContractAt("IdentityRegistry", registryAddr);
    // Note: V2 might be named IdentityRegistry in artifacts if standard

    const targetUser = deployer.address;

    // 2. Ensure KYC
    const isVerified = await Registry.isVerified(targetUser);
    console.log(`User Verified: ${isVerified}`);
    if (!isVerified) {
        console.log("Registering User for KYC...");
        // hash mock
        const hash = ethers.id("US-12345");
        await (await Registry.register(targetUser, hash)).wait();
        console.log("User Registered.");
    }

    // 3. Ensure Backing
    const backing = await Bond.totalBackedValue();
    const supply = await Bond.totalSupply();
    console.log(`Backing: ${ethers.formatUnits(backing, 6)} | Supply: ${ethers.formatUnits(supply, 18)}`);

    if (backing == 0n || backing <= (supply / 10n ** 12n)) { // Approx check
        console.log("Adding Asset Backing...");
        await (await Bond.addAsset("https://doc", ethers.parseUnits("1000000", 6))).wait();
        console.log("Asset Added.");
    }

    // 4. Ensure I have Bond
    const balance = await Bond.balanceOf(targetUser);
    console.log(`User Bond Balance: ${ethers.formatUnits(balance, 18)} GBOND`);

    if (balance == 0n) {
        console.log("Minting 100 GBOND via adminMint...");
        // adminMint expects amount in USDT (6 decimals) and converts to 18
        await (await Treasury.adminMint(targetUser, ethers.parseUnits("100", 6))).wait();
        console.log("Minted.");
    }

    const startBond = await Bond.balanceOf(targetUser);
    const startUsdt = await USDT.balanceOf(targetUser);

    // 2. Perform Admin Redeem (Gasless)
    // Redeem 10 GBOND
    const redeemAmount = ethers.parseUnits("10", 18);
    console.log("Calling adminRedeem(10 GBOND)...");

    try {
        const tx = await Treasury.adminRedeem(targetUser, redeemAmount);
        console.log("TX Sent:", tx.hash);
        await tx.wait();
        console.log("Redemption Confirmed!");

        // 3. Verify Balances
        const endBond = await Bond.balanceOf(targetUser);
        const endUsdt = await USDT.balanceOf(targetUser);

        console.log(`Bond Change: ${ethers.formatUnits(endBond - startBond, 18)} (Expected -10.0)`);
        console.log(`USDT Change: ${ethers.formatUnits(endUsdt - startUsdt, 6)} (Expected +10.0)`);
    } catch (e: any) {
        console.error("Redemption FAILED:", e.message);
        try {
            // Try to call static to get revert reason
            await Treasury.adminRedeem.staticCall(targetUser, redeemAmount);
        } catch (e2: any) {
            console.error("Revert Reason:", e2.reason || e2.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
