import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
    const gatewayAddress = process.env.SWAP_GATEWAY_ADDRESS;
    const [admin] = await ethers.getSigners();
    console.log(`Checking Gateway Owner for ${gatewayAddress} using admin ${admin.address}`);

    const InvestmentGateway = await ethers.getContractFactory("InvestmentGateway");
    const gateway = InvestmentGateway.attach(gatewayAddress!);

    const owner = await gateway.owner();
    console.log(`Gateway Owner: ${owner}`);
    console.log(`Is Admin Owner? ${owner === admin.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
