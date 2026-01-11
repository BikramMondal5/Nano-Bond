import hre from "hardhat";

async function main() {
    const networkName = hre.network.name;
    console.log(`Deploying MockUSDT on ${networkName}...`);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const usdtAddr = await usdt.getAddress();
    console.log("MockUSDT deployed to:", usdtAddr);

    // Mint some tokens for testing
    console.log("Minting test tokens...");
    const mintTx = await usdt.mint(deployer.address, hre.ethers.parseUnits("1000000", 6));
    await mintTx.wait();
    console.log("Minted 1,000,000 USDT to deployer");

    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Network:", networkName);
    console.log("MockUSDT Address:", usdtAddr);
    console.log("Update this address in deploy-source-chain.ts");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});