
import { ethers } from 'ethers';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("Deploying InvestmentGateway directly...");

    // 1. Load Artifact
    const artifactPath = path.resolve(__dirname, '../../../contracts/artifacts/contracts/InvestmentGateway.sol/InvestmentGateway.json');
    if (!fs.existsSync(artifactPath)) {
        console.error("Artifact not found at:", artifactPath);
        process.exit(1);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // 2. Setup Provider/Wallet
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    // 3. Define USDT Address (Backdoor Enabled)
    const usdtAddress = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
    console.log(`Using USDT: ${usdtAddress}`);
    console.log(`Deployer: ${wallet.address}`);

    // 4. Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    try {
        const contract = await factory.deploy(usdtAddress);
        console.log(`Deploying... TX: ${contract.deploymentTransaction()?.hash}`);

        await contract.waitForDeployment();
        const address = await contract.getAddress();

        console.log(`\n✅ InvestmentGateway Deployed to: ${address}`);

        // Write to file for safety
        const outPath = path.resolve(__dirname, 'deployed_gateway_address.txt');
        fs.writeFileSync(outPath, address);
        console.log(`Address written to: ${outPath}`);

    } catch (e: any) {
        console.error("Deployment failed:", e.message);
    }
}

main();
