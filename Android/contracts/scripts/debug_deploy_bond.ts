import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Debug Deploying with:", deployer.address);

    try {
        console.log("Deploying IdentityRegistry...");
        const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
        const registry = await IdentityRegistry.deploy(deployer.address);
        await registry.waitForDeployment();
        console.log("Registry deployed at:", await registry.getAddress());

        console.log("Deploying SovereignBond...");
        const SovereignBond = await ethers.getContractFactory("SovereignBond");
        const bond = await SovereignBond.deploy("Sovereign Bond", "SOV", await registry.getAddress(), deployer.address);
        await bond.waitForDeployment();
        console.log("Bond deployed at:", await bond.getAddress());

    } catch (error) {
        console.error("DEPLOYMENT FAILED:");
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
