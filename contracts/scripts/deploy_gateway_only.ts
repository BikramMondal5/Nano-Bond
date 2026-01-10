import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
    const usdtAddress = process.env.USDT_ADDRESS;
    if (!usdtAddress) {
        throw new Error("USDT_ADDRESS is missing in .env");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Deploying InvestmentGateway with account:", deployer.address);
    console.log("Using MockUSDT at:", usdtAddress);

    const InvestmentGateway = await ethers.getContractFactory("InvestmentGateway");
    const gateway = await InvestmentGateway.deploy(usdtAddress);

    await gateway.waitForDeployment();

    const gatewayAddr = await gateway.getAddress();
    console.log("InvestmentGateway deployed to:", gatewayAddr);

    const fs = require("fs");
    fs.writeFileSync("deployed_gateway.txt", gatewayAddr);
    console.log("Address saved to deployed_gateway.txt");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
