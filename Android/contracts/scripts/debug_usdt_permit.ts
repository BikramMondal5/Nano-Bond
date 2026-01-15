import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
    // 1. Get Config
    const usdtAddress = process.env.USDT_ADDRESS;
    if (!usdtAddress) throw new Error("USDT_ADDRESS missing in .env");

    const [admin] = await ethers.getSigners();
    console.log(`Debugging MockUSDT at ${usdtAddress} with account ${admin.address}`);

    // 2. Attach Contract
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = MockUSDT.attach(usdtAddress);

    // 3. Test Permit with Dummy Values
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const dummyV = 27;
    const dummyR = ethers.ZeroHash;
    const dummyS = ethers.ZeroHash;
    const spender = admin.address; // Approve self
    const value = 1000;

    console.log("Attempting permit with dummy signature...");

    try {
        const tx = await usdt.permit(admin.address, spender, value, deadline, dummyV, dummyR, dummyS);
        console.log("Permit call sent:", tx.hash);
        await tx.wait();
        console.log("✅ Permit SUCCESS! (Demo Mode is Active)");

        const allowance = await usdt.allowance(admin.address, spender);
        console.log("Allowance check:", allowance.toString());

    } catch (error: any) {
        console.error("❌ Permit FAILED! (Likely standard implementation checking signature)");
        console.error("Error:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
