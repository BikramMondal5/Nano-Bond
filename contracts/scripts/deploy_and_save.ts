import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Starting Sovereign DPI Deployment (with JSON logging)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MockUSDT (For Testnet)
    console.log("Deploying MockUSDT...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();
    const usdtAddr = await usdt.getAddress();
    console.log("MockUSDT deployed to:", usdtAddr);

    // 2. Deploy IdentityRegistry
    console.log("Deploying IdentityRegistry...");
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    const registry = await IdentityRegistry.deploy(deployer.address);
    await registry.waitForDeployment();
    const registryAddr = await registry.getAddress();
    console.log("IdentityRegistry deployed to:", registryAddr);

    // 3. Deploy SovereignBond
    console.log("Deploying SovereignBond...");
    const SovereignBond = await ethers.getContractFactory("SovereignBond");
    const bond = await SovereignBond.deploy("Sovereign Bond", "SOV", registryAddr, deployer.address);
    await bond.waitForDeployment();
    const bondAddr = await bond.getAddress();
    console.log("SovereignBond deployed to:", bondAddr);

    // 4. Deploy TreasurySwap
    console.log("Deploying TreasurySwap...");
    const TreasurySwap = await ethers.getContractFactory("TreasurySwap");
    const treasury = await TreasurySwap.deploy(usdtAddr, bondAddr, deployer.address);
    await treasury.waitForDeployment();
    const treasuryAddr = await treasury.getAddress();
    console.log("TreasurySwap deployed to:", treasuryAddr);

    // 5. Grant Minter Role to Treasury
    console.log("Granting Minter Role to Treasury...");
    const MINTER_ROLE = await bond.MINTER_ROLE();
    const tx = await bond.grantRole(MINTER_ROLE, treasuryAddr);
    await tx.wait();
    console.log("Minter Role Granted.");

    // 6. Deploy MockRouter (For Testnet)
    console.log("Deploying MockRouter...");
    const MockRouter = await ethers.getContractFactory("MockRouter");
    const router = await MockRouter.deploy(usdtAddr);
    await router.waitForDeployment();
    const routerAddr = await router.getAddress();
    console.log("MockRouter deployed to:", routerAddr);

    // 7. Deploy SwapGateway
    console.log("Deploying SwapGateway...");
    const SwapGateway = await ethers.getContractFactory("SwapGateway");
    const gateway = await SwapGateway.deploy(treasuryAddr, usdtAddr, routerAddr, usdtAddr);
    await gateway.waitForDeployment();
    const gatewayAddr = await gateway.getAddress();
    console.log("SwapGateway deployed to:", gatewayAddr);

    // 8. Deploy CouponDistributor
    console.log("Deploying CouponDistributor...");
    const CouponDistributor = await ethers.getContractFactory("CouponDistributor");
    const distributor = await CouponDistributor.deploy(usdtAddr, bondAddr, deployer.address);
    await distributor.waitForDeployment();
    const distributorAddr = await distributor.getAddress();
    console.log("CouponDistributor deployed to:", distributorAddr);

    // 9. Deploy CrossChainInvestmentGateway
    console.log("Deploying CrossChainInvestmentGateway...");
    const mantleSepoliaEndpoint = "0x6EDCE65403992e310A62460808c4b910D972f10f"; // LayerZero V2 Endpoint
    const CrossChainGateway = await ethers.getContractFactory("CrossChainInvestmentGateway");
    const crossChainGateway = await CrossChainGateway.deploy(
        mantleSepoliaEndpoint,
        usdtAddr,
        treasuryAddr,
        deployer.address
    );
    await crossChainGateway.waitForDeployment();
    const crossChainGatewayAddr = await crossChainGateway.getAddress();
    console.log("CrossChainInvestmentGateway deployed to:", crossChainGatewayAddr);

    // 10. Link Bond to Distributor (For Hooks)
    console.log("Linking Bond to Distributor...");
    await bond.setDistributor(distributorAddr);
    console.log("Bond Linked.");

    const addresses = {
        USDT: usdtAddr,
        Registry: registryAddr,
        Bond: bondAddr,
        Treasury: treasuryAddr,
        Gateway: gatewayAddr,
        Distributor: distributorAddr,
        CrossChainGateway: crossChainGatewayAddr
    };

    const outputPath = path.join(__dirname, "../deployed_addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

    console.log("\n=================================================");
    console.log("DEPLOYMENT COMPLETE & SAVED TO JSON");
    console.log("=================================================");
    console.log(addresses);
    console.log("=================================================\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
