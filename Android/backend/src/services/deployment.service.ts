import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const findArtifactsRoot = () => {
    let currentDir = process.cwd();

    while (currentDir !== path.parse(currentDir).root) {
        const candidate = path.join(currentDir, 'contracts', 'artifacts', 'contracts');
        if (fs.existsSync(candidate)) return candidate;
        currentDir = path.dirname(currentDir);
    }

    throw new Error('Could not locate contracts/artifacts/contracts. Build contracts first.');
};

const ARTIFACTS_CONTRACTS_DIR = findArtifactsRoot();

const loadArtifact = (contractName: string, solidityFileName: string) => {
    const filePath = path.join(ARTIFACTS_CONTRACTS_DIR, `${solidityFileName}.sol`, `${contractName}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
};

export interface ManagedDeploymentResult {
    contractAddress: string;
    treasuryAddress: string;
    distributorAddress: string;
}

export class DeploymentService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private isDeploying = false;

    constructor() {
        if (!config.admin.privateKey) {
            throw new Error('Admin private key not configured');
        }

        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.wallet = new ethers.Wallet(config.admin.privateKey, this.provider);
    }

    async deployBondProduct(params: {
        bondName: string;
        bondId: string;
        ownerWallet: string;
    }): Promise<ManagedDeploymentResult> {
        const { bondName, bondId, ownerWallet } = params;

        const USDT_ADDRESS = config.contracts.usdtAddress;
        const REGISTRY_ADDRESS = config.contracts.registryAddress;

        if (!USDT_ADDRESS || !REGISTRY_ADDRESS) {
            throw new Error('Missing USDT_ADDRESS or IDENTITY_REGISTRY_ADDRESS in backend config');
        }

        const BondArtifact = loadArtifact('SovereignBond', 'SovereignBond');
        const TreasuryArtifact = loadArtifact('TreasurySwap', 'TreasurySwap');
        const DistributorArtifact = loadArtifact('CouponDistributor', 'CouponDistributor');

        if (this.isDeploying) {
            throw new Error('Another deployment is currently in progress. Please wait.');
        }

        this.isDeploying = true;

        try {
            const symbol = bondId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            const BondFactory = new ethers.ContractFactory(BondArtifact.abi, BondArtifact.bytecode, this.wallet);
            const bondContract = await BondFactory.deploy(bondName, symbol, REGISTRY_ADDRESS, this.wallet.address);
            await bondContract.waitForDeployment();
            const bondAddress = await bondContract.getAddress();

            const TreasuryFactory = new ethers.ContractFactory(TreasuryArtifact.abi, TreasuryArtifact.bytecode, this.wallet);
            const treasuryContract = await TreasuryFactory.deploy(USDT_ADDRESS, bondAddress, ownerWallet);
            await treasuryContract.waitForDeployment();
            const treasuryAddress = await treasuryContract.getAddress();

            const DistributorFactory = new ethers.ContractFactory(DistributorArtifact.abi, DistributorArtifact.bytecode, this.wallet);
            const distributorContract = await DistributorFactory.deploy(USDT_ADDRESS, bondAddress, ownerWallet);
            await distributorContract.waitForDeployment();
            const distributorAddress = await distributorContract.getAddress();

            const bondContractAny = bondContract as any;
            const minterRole = await bondContractAny.MINTER_ROLE();

            const grantMinterTx = await bondContractAny.grantRole(minterRole, treasuryAddress);
            await grantMinterTx.wait();

            const grantAdminTx = await bondContractAny.grantRole(ethers.ZeroHash, ownerWallet);
            await grantAdminTx.wait();

            const setDistributorTx = await bondContractAny.setDistributor(distributorAddress);
            await setDistributorTx.wait();

            return {
                contractAddress: bondAddress,
                treasuryAddress,
                distributorAddress,
            };
        } finally {
            this.isDeploying = false;
        }
    }
}
