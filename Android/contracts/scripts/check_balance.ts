import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Checking balance for: ${deployer.address}`);

    // Check Provider Network
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log(`Connected to Network Chain ID: ${network.chainId}`);

    const balance = await provider.getBalance(deployer.address);
    console.log(`Native Token Balance: ${ethers.formatEther(balance)} MNT`);

    if (balance === 0n) {
        console.log("\n⚠️  You have 0 MNT on Mantle Sepolia.");
        console.log("If you have 'Sepolia ETH', you are on the wrong chain.");
        console.log("You must BRIDGE Sepolia ETH -> Mantle MNT.");
    } else {
        console.log("\n✅ You have funds! Try deploying again.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
