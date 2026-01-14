import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Polygon Amoy addresses
const USDT_POLYGON = "0x9565c705f598Af4B477CCf9C8390BFCD8634E919";

async function main() {
    console.log("Deploying InvestmentGateway on Polygon Amoy...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Using USDT:", USDT_POLYGON);

    // Deploy InvestmentGateway
    const InvestmentGateway = await hre.ethers.getContractFactory("InvestmentGateway");
    const gateway = await InvestmentGateway.deploy(USDT_POLYGON);

    await gateway.waitForDeployment();
    const gatewayAddr = await gateway.getAddress();

    console.log("✅ InvestmentGateway deployed to:", gatewayAddr);

    // Save deployment info
    const addresses = {
        network: "polygonAmoy",
        InvestmentGateway: gatewayAddr,
        USDT: USDT_POLYGON
    };

    const outputPath = path.join(__dirname, "../deployed_polygon_infrastructure.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

    console.log("\n✅ Deployment complete!");
    console.log("Saved to:", outputPath);
    console.log("\nNEXT STEPS:");
    console.log("1. Update backend/.env:");
    console.log(`   POLYGON_INVESTMENT_GATEWAY=${gatewayAddr}`);
    console.log("2. Update backend config to support Polygon");
    console.log("3. Test investment on Polygon Amoy");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
