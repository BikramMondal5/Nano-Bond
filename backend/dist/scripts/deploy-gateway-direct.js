"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("../config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    console.log("Deploying InvestmentGateway directly...");
    // 1. Load Artifact
    const artifactPath = path_1.default.resolve(__dirname, '../../../contracts/artifacts/contracts/InvestmentGateway.sol/InvestmentGateway.json');
    if (!fs_1.default.existsSync(artifactPath)) {
        console.error("Artifact not found at:", artifactPath);
        process.exit(1);
    }
    const artifact = JSON.parse(fs_1.default.readFileSync(artifactPath, 'utf8'));
    // 2. Setup Provider/Wallet
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    // 3. Define USDT Address (Backdoor Enabled)
    const usdtAddress = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
    console.log(`Using USDT: ${usdtAddress}`);
    console.log(`Deployer: ${wallet.address}`);
    // 4. Deploy
    const factory = new ethers_1.ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    try {
        const contract = await factory.deploy(usdtAddress);
        console.log(`Deploying... TX: ${contract.deploymentTransaction()?.hash}`);
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`\n✅ InvestmentGateway Deployed to: ${address}`);
        // Write to file for safety
        const outPath = path_1.default.resolve(__dirname, 'deployed_gateway_address.txt');
        fs_1.default.writeFileSync(outPath, address);
        console.log(`Address written to: ${outPath}`);
    }
    catch (e) {
        console.error("Deployment failed:", e.message);
    }
}
main();
