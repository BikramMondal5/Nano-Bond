
import { ethers } from 'ethers';
import { config } from '../src/config';
import fs from 'fs';
import path from 'path';

async function deploy() {
    console.log('Deploying IdentityRegistry...');

    if (!config.admin.privateKey) {
        console.error('Error: PRIVATE_KEY not found in .env');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    console.log('Deploying from:', wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'MNT');

    // Read contract artifact (compiled JSON)
    // Assuming hardhat artifacts structure, but we might need to compile first
    // For simplicity, let's include the ABI and Bytecode here if we can find it
    // Or simpler: let's try to compile it or assume it's compiled.

    // Actually, since we're in a TS backend environment, we might not have hardhat runtime here.
    // Let's assume the user has solidity compiler or we can use a pre-compiled artifact if available.
    // Let's check for artifacts first.

    const bytecodePath = path.join(__dirname, '../../contracts/artifacts/contracts/IdentityRegistryV2.sol/IdentityRegistryV2.json');

    if (!fs.existsSync(bytecodePath)) {
        console.error('Error: Contract artifacts not found at', bytecodePath);
        console.error('Please run "npx hardhat compile" in the contracts directory first.');
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Constructor requires admin address
    const contract = await factory.deploy(wallet.address);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log('IdentityRegistry deployed to:', address);
    console.log('\nPlease update your .env file with:');
    console.log(`IDENTITY_REGISTRY_ADDRESS=${address}`);
}

deploy().catch(console.error);
