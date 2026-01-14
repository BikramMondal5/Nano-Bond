
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Load Artifacts
// Load Artifacts - Robust Root Finding
const getProjectRoot = () => {
    let currentDir = process.cwd();
    while (currentDir !== path.parse(currentDir).root) {
        if (fs.existsSync(path.join(currentDir, 'contracts', 'artifacts'))) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    // Fallback to strict CWD if search fails (though it shouldn't in this repo)
    console.warn('[DeploymentService] Could not find contracts folder walking up. Using CWD.');
    return process.cwd();
};

const PROJECT_ROOT = getProjectRoot();
console.log(`[DeploymentService] Resolved PROJECT_ROOT: ${PROJECT_ROOT}`);

const ARTIFACTS_DIR = path.resolve(PROJECT_ROOT, 'contracts/artifacts/contracts');

// Helper to load ABI/Bytecode
const loadArtifact = (contractName: string, folderName?: string) => {
    const folder = folderName || contractName;
    const filePath = path.join(ARTIFACTS_DIR, `${folder}.sol`, `${contractName}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
};

export class DeploymentService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    constructor() {
        if (!config.admin.privateKey) {
            throw new Error('Admin private key not configured');
        }
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.wallet = new ethers.Wallet(config.admin.privateKey, this.provider);
    }

    async deployBondProduct(bondName: string, bondId: string) {
        console.log(`[DeploymentService] Starting deployment for ${bondName} (${bondId})...`);

        // 1. Get Shared Core Addresses
        const USDT_ADDRESS = config.contracts.usdtAddress;
        const REGISTRY_ADDRESS = config.contracts.registryAddress;

        console.log(`[DeploymentService] Config USDT:     ${USDT_ADDRESS}`);
        console.log(`[DeploymentService] Config Registry: ${REGISTRY_ADDRESS}`);

        if (!USDT_ADDRESS || !REGISTRY_ADDRESS) {
            throw new Error('Missing Shared Core Addresses (USDT or Registry) in config');
        }

        // 2. Load Artifacts
        const BondArtifact = loadArtifact('SovereignBond');
        const TreasuryArtifact = loadArtifact('TreasurySwap');
        const DistributorArtifact = loadArtifact('CouponDistributor');

        // Fetch current nonce once to manage manually
        let currentNonce = await this.provider.getTransactionCount(this.wallet.address, "latest");
        console.log(`[DeploymentService] Starting Nonce: ${currentNonce}`);

        // 3. Deploy Bond Token
        const BondFactory = new ethers.ContractFactory(BondArtifact.abi, BondArtifact.bytecode, this.wallet);
        // Symbol generated from ID (e.g. "GOI2030")
        const symbol = bondId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        console.log(`[DeploymentService] Deploying Bond Token ${symbol}... (Nonce: ${currentNonce})`);

        const bondContract = await BondFactory.deploy(bondName, symbol, REGISTRY_ADDRESS, this.wallet.address, { nonce: currentNonce++ });
        await bondContract.waitForDeployment();
        const bondAddress = await bondContract.getAddress();
        console.log(`[DeploymentService] Local Bond Deployed: ${bondAddress}`);

        // 4. Deploy Treasury
        console.log(`[DeploymentService] Deploying Treasury... (Nonce: ${currentNonce})`);
        const TreasuryFactory = new ethers.ContractFactory(TreasuryArtifact.abi, TreasuryArtifact.bytecode, this.wallet);
        const treasuryContract = await TreasuryFactory.deploy(USDT_ADDRESS, bondAddress, this.wallet.address, { nonce: currentNonce++ });
        await treasuryContract.waitForDeployment();
        const treasuryAddress = await treasuryContract.getAddress();
        console.log(`[DeploymentService] Local Treasury Deployed: ${treasuryAddress}`);

        // 5. Deploy Distributor
        console.log(`[DeploymentService] Deploying Distributor... (Nonce: ${currentNonce})`);
        const DistributorFactory = new ethers.ContractFactory(DistributorArtifact.abi, DistributorArtifact.bytecode, this.wallet);
        const distributorContract = await DistributorFactory.deploy(USDT_ADDRESS, bondAddress, this.wallet.address, { nonce: currentNonce++ });
        await distributorContract.waitForDeployment();
        const distributorAddress = await distributorContract.getAddress();
        console.log(`[DeploymentService] Local Distributor Deployed: ${distributorAddress}`);

        // 6. Link Contracts (Grant Minter Role)
        console.log(`[DeploymentService] Linking Contracts...`);
        // We know the MINTER_ROLE hash, but good to fetch from contract to be safe
        // const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")); 
        // Using "call" to get it safely
        const bondContractAny = bondContract as any;
        const minterRole = await bondContractAny.MINTER_ROLE();

        const tx = await bondContractAny.grantRole(minterRole, treasuryAddress, { nonce: currentNonce++ });
        await tx.wait();
        console.log(`[DeploymentService] Contracts Linked. Treasury is Minter.`);

        return {
            contractAddress: bondAddress,
            treasuryAddress: treasuryAddress,
            distributorAddress: distributorAddress
        };
    }
}
