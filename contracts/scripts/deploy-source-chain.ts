import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// LayerZero V2 Endpoints
const ENDPOINTS = {
    ethereumSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    arbitrumSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    polygonAmoy: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    scrollSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
};

// USDT addresses on testnets
const USDT_ADDRESSES = {
    ethereumSepolia: "0x9C497178995f70d1A5cbf33225Fc0D8B15469F8a",
    arbitrumSepolia: "0x17830508db410b208F38641b57C723fCBa41c68b",
    polygonAmoy: "0x9565c705f598Af4B477CCf9C8390BFCD8634E919",
    scrollSepolia: "0x71678089A61FA4bcC64182693df2709DB6B115Fd",
};

async function main() {
    const networkName = hre.network.name;
    console.log(`Deploying CrossChainInvestmentGateway on ${networkName}...`);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const endpoint = ENDPOINTS[networkName as keyof typeof ENDPOINTS];
    const usdt = USDT_ADDRESSES[networkName as keyof typeof USDT_ADDRESSES];

    if (!endpoint || !usdt) {
        throw new Error(`Network ${networkName} not configured`);
    }

    console.log("Using LayerZero Endpoint:", endpoint);
    console.log("Using USDT:", usdt);

    const CrossChainGateway = await hre.ethers.getContractFactory("CrossChainInvestmentGateway");
    const gateway = await CrossChainGateway.deploy(
        endpoint,
        usdt,
        hre.ethers.ZeroAddress, // No treasury on source chains
        deployer.address
    );

    await gateway.waitForDeployment();
    const gatewayAddr = await gateway.getAddress();

    console.log("CrossChainInvestmentGateway deployed to:", gatewayAddr);

    const addresses = {
        network: networkName,
        CrossChainGateway: gatewayAddr,
        LayerZeroEndpoint: endpoint,
        USDT: usdt,
    };

    const outputPath = path.join(__dirname, `../deployed_${networkName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

    console.log("\nDeployment complete and saved to:", outputPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});