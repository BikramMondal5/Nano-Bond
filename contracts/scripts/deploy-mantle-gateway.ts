import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// LayerZero V2 Endpoint on Mantle Sepolia
const MANTLE_ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";

// USDT and Treasury addresses on Mantle
const USDT_ADDRESS = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
const TREASURY_ADDRESS = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB"; // InvestmentGateway

async function main() {
    console.log("Deploying CrossChainInvestmentGateway on Mantle Sepolia...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    console.log("Using LayerZero Endpoint:", MANTLE_ENDPOINT);
    console.log("Using USDT:", USDT_ADDRESS);
    console.log("Using Treasury:", TREASURY_ADDRESS);

    const CrossChainGateway = await hre.ethers.getContractFactory("CrossChainInvestmentGateway");
    const gateway = await CrossChainGateway.deploy(
        MANTLE_ENDPOINT,
        USDT_ADDRESS,
        TREASURY_ADDRESS, // Treasury is set on Mantle (destination)
        deployer.address
    );

    await gateway.waitForDeployment();
    const gatewayAddr = await gateway.getAddress();

    console.log("CrossChainInvestmentGateway deployed to:", gatewayAddr);

    const addresses = {
        network: "mantleSepolia",
        CrossChainGateway: gatewayAddr,
        LayerZeroEndpoint: MANTLE_ENDPOINT,
        USDT: USDT_ADDRESS,
        Treasury: TREASURY_ADDRESS
    };

    const outputPath = path.join(__dirname, "../deployed_mantleSepolia.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

    console.log("\nDeployment complete and saved to:", outputPath);
    console.log("\nNEXT STEPS:");
    console.log("1. Update CROSS_CHAIN_GATEWAY_MANTLE in backend/.env");
    console.log("2. Update NEXT_PUBLIC_CROSS_CHAIN_GATEWAY_MANTLE in .env.local");
    console.log("3. Configure peers on all source chains to point to this address");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
