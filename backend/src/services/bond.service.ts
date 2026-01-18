import { ethers } from 'ethers';
import { config } from '../config';
import { Bond, IBond } from '../models/Bond';
import { DeploymentService } from './deployment.service';

// Bond ABI - Essential functions only
const BOND_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function totalSupply() external view returns (uint256)",
    "function totalBackedValue() external view returns (uint256)",
    "function maturityDate() external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)"
];

// API response format
export interface BondDto {
    bondId: string;
    bondName: string;
    issuer: string;
    contractAddress: string;
    treasuryAddress?: string;
    distributorAddress?: string;
    couponRate: number;
    minInvestment: number;
    maxSubscription: number;
    startDate: string | null;
    maturityDate: string | null;
    description: string | null;
    proofUrl: string | null;
    // On-chain data
    totalSupply: string;
    totalBackedValue: string;
    symbol: string;
}

export interface BondCreationDto {
    bondId: string;
    bondName: string;
    issuer: string; // "Government of India"
    couponRate: number;
    minInvestment: number;
    maxSubscription: number; // e.g. 500000 USD
    startDate: Date;
    maturityDate: Date;
    description: string;
}

export class BondService {
    private provider: ethers.JsonRpcProvider;
    private deploymentService: DeploymentService;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.deploymentService = new DeploymentService();
    }

    /**
     * Deploy new contracts for a bond (Low Level)
     */
    async deployBondContracts(bondId: string, bondName: string) {
        return await this.deploymentService.deployBondProduct(bondName, bondId);
    }

    /**
     * Create a fully managed bond: Deploy -> Link -> Grant Admin -> Save DB
     */
    async createManagedBond(details: BondCreationDto, ownerAddress: string): Promise<BondDto> {
        console.log(`[BondService] Creating managed bond: ${details.bondId} for owner ${ownerAddress}`);

        // 1. Deploy Contracts
        const deployment = await this.deploymentService.deployBondProduct(details.bondName, details.bondId);
        console.log(`[BondService] Deployed at: ${deployment.contractAddress}`);

        // ===============================================
        // SYSTEMIC SAFEGUARD: Post-Deployment Verification
        // ===============================================
        try {
            console.log(`[BondService] VERIFYING Treasury Config for ${details.bondId}...`);
            const treasuryContract = new ethers.Contract(
                deployment.treasuryAddress,
                ["function paymentToken() view returns (address)"],
                this.provider
            );
            const onChainUSDT = await treasuryContract.paymentToken();
            const expectedUSDT = config.contracts.usdtAddress;

            if (onChainUSDT.toLowerCase() !== expectedUSDT.toLowerCase()) {
                const errorMsg = `CRITICAL DEPLOYMENT FAILURE: Treasury USDT Mismatch! Expected ${expectedUSDT}, Got ${onChainUSDT}`;
                console.error(`[BondService] ${errorMsg}`);
                throw new Error(errorMsg);
            }
            console.log(`[BondService] ✅ Treasury Verified (USDT: ${onChainUSDT})`);
        } catch (verifyError: any) {
            console.error(`[BondService] Verification Failed: ${verifyError.message}`);
            // We should arguably NOT save this bond to DB, or save as 'failed'
            throw new Error(`Deployment Verification Failed: ${verifyError.message}`);
        }

        try {
            console.log(`[BondService] VERIFYING Distributor Config for ${details.bondId}...`);
            const distContract = new ethers.Contract(
                deployment.distributorAddress,
                ["function paymentToken() view returns (address)"],
                this.provider
            );
            const distUSDT = await distContract.paymentToken();
            const expectedUSDT = config.contracts.usdtAddress;

            if (distUSDT.toLowerCase() !== expectedUSDT.toLowerCase()) {
                const errorMsg = `CRITICAL DEPLOYMENT FAILURE: Distributor USDT Mismatch! Expected ${expectedUSDT}, Got ${distUSDT}`;
                console.error(`[BondService] ${errorMsg}`);
                throw new Error(errorMsg);
            }
            console.log(`[BondService] ✅ Distributor Verified (USDT: ${distUSDT})`);
        } catch (verifyError: any) {
            console.error(`[BondService] Distributor Verification Failed: ${verifyError.message}`);
            throw new Error(`Deployment Verification Failed (Distributor): ${verifyError.message}`);
        }
        // ===============================================

        // 2. Grant DEFAULT_ADMIN_ROLE to Owner on ALL contracts
        // DEFAULT_ADMIN_ROLE is 0x00...00
        const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
        const deployerWallet = new ethers.Wallet(config.admin.privateKey, this.provider);
        const grantRoleAbi = ["function grantRole(bytes32, address) external"];

        const bondContract = new ethers.Contract(deployment.contractAddress, grantRoleAbi, deployerWallet);
        const treasuryContract = new ethers.Contract(deployment.treasuryAddress, grantRoleAbi, deployerWallet);
        const distributorContract = new ethers.Contract(deployment.distributorAddress, grantRoleAbi, deployerWallet);

        console.log(`[BondService] Granting ADMIN role to ${ownerAddress} on Bond, Treasury, and Distributor...`);

        // Parallel execution for speed (requires separate nonces if fast, but await sequential is safer usually or Promise.all with managed nonces)
        // Let's do sequential to avoid nonce errors without complex logic
        await (await bondContract.grantRole(DEFAULT_ADMIN_ROLE, ownerAddress)).wait();
        await (await treasuryContract.grantRole(DEFAULT_ADMIN_ROLE, ownerAddress)).wait();
        await (await distributorContract.grantRole(DEFAULT_ADMIN_ROLE, ownerAddress)).wait();

        console.log(`[BondService] Roles Granted on all contracts.`);

        // 3. Save to DB
        // Check if exists
        let bondDoc = await Bond.findOne({ bondId: details.bondId });
        if (!bondDoc) {
            bondDoc = new Bond({
                bondId: details.bondId,
                bondName: details.bondName,
                issuer: details.issuer,
                couponRate: details.couponRate,
                minInvestment: details.minInvestment,
                maxSubscription: details.maxSubscription,
                startDate: details.startDate,
                maturityDate: details.maturityDate,
                description: details.description,
                contractAddress: deployment.contractAddress,
                treasuryAddress: deployment.treasuryAddress,
                distributorAddress: deployment.distributorAddress,
                status: 'active', // or 'pending_backing'
                adminWallet: ownerAddress // <--- FIXED: Save admin wallet
            });
        } else {
            // Update existing
            bondDoc.contractAddress = deployment.contractAddress;
            bondDoc.treasuryAddress = deployment.treasuryAddress;
            bondDoc.distributorAddress = deployment.distributorAddress;
            bondDoc.adminWallet = ownerAddress; // <--- FIXED: Update admin wallet
            // Update other fields as well to match request
            bondDoc.bondName = details.bondName;
            bondDoc.couponRate = details.couponRate;
            bondDoc.maxSubscription = details.maxSubscription;
        }

        await bondDoc.save();
        console.log(`[BondService] Bond saved to DB.`);

        return this.mapDocToPartial(bondDoc);
    }

    /**
     * Helper to map Mongo document to DTO partial (without on-chain data)
     */
    private mapDocToPartial(doc: IBond): any {
        return {
            bondId: doc.bondId,
            bondName: doc.bondName,
            issuer: doc.issuer,
            contractAddress: doc.contractAddress || config.contracts.bondAddress,
            treasuryAddress: doc.treasuryAddress,
            distributorAddress: doc.distributorAddress,
            couponRate: doc.couponRate,
            minInvestment: doc.minInvestment,
            maxSubscription: doc.maxSubscription,
            startDate: doc.startDate ? doc.startDate.toISOString() : null,
            maturityDate: doc.maturityDate ? doc.maturityDate.toISOString() : null,
            description: doc.description || null,
            proofUrl: doc.proofUrl || null,
        };
    }

    /**
     * Fetch on-chain data for a bond contract
     */
    private async fetchOnChainData(contractAddress: string): Promise<{
        name: string;
        symbol: string;
        totalSupply: string;
        totalBackedValue: string;
        maturityDateOnChain: number;
    } | null> {
        try {
            const contract = new ethers.Contract(contractAddress, BOND_ABI, this.provider);

            const [name, symbol, totalSupply, totalBackedValue, maturityDateOnChain] = await Promise.all([
                contract.name().catch(() => 'Unknown'),
                contract.symbol().catch(() => 'BOND'),
                contract.totalSupply().catch(() => BigInt(0)),
                contract.totalBackedValue().catch(() => BigInt(0)),
                contract.maturityDate().catch(() => BigInt(0)),
            ]);

            return {
                name,
                symbol,
                totalSupply: ethers.formatUnits(totalSupply, 6),
                totalBackedValue: ethers.formatUnits(totalBackedValue, 6),
                maturityDateOnChain: Number(maturityDateOnChain),
            };
        } catch (error) {
            console.error(`[BondService] Failed to fetch on-chain data for ${contractAddress}:`, error);
            return null;
        }
    }

    /**
     * List all bonds from DB with on-chain data
     */
    async listBonds(): Promise<BondDto[]> {
        const dbBonds = await Bond.find({});
        const results: BondDto[] = [];

        for (const b of dbBonds) {
            // Fallback: If registry doesn't specify a contract, use the default Sovereign Bond address
            const targetAddress = b.contractAddress || config.contracts.bondAddress;
            if (!targetAddress) continue; // Skip if no address available at all

            const onChain = await this.fetchOnChainData(targetAddress);

            results.push({
                ...this.mapDocToPartial(b),
                contractAddress: targetAddress, // ensure we use the resolved one
                totalSupply: onChain?.totalSupply || '0',
                totalBackedValue: onChain?.totalBackedValue || '0',
                symbol: onChain?.symbol || 'BOND',
            });
        }

        return results;
    }

    /**
     * Get a single bond by contract address
     */
    async getBondByAddress(contractAddress: string): Promise<BondDto | null> {
        // We might not be able to query by contractAddress directly if it's dynamic or fallback
        // So we might search all and filter, or add contractAddress to schema index
        // Since we have low volume, findOne based on precise match first
        let doc = await Bond.findOne({ contractAddress: { $regex: new RegExp(`^${contractAddress}$`, 'i') } });

        // If not found, it might be using the default address but not stored in DB with it?
        // But logic says if DB entry has NO address, it uses default.
        if (!doc) {
            // If the queried address IS the default address, we might return the first bond that uses it?
            // Or maybe we should improve the query. For now, let's just stick to DB structure.
            // If you query for a specific address, we expect it to be in the DB or be the default one.
            if (config.contracts.bondAddress && contractAddress.toLowerCase() === config.contracts.bondAddress.toLowerCase()) {
                // Return the first one that has no address or matching address
                doc = await Bond.findOne({
                    $or: [
                        { contractAddress: { $exists: false } },
                        { contractAddress: null },
                        { contractAddress: { $regex: new RegExp(`^${contractAddress}$`, 'i') } }
                    ]
                });
            }
        }

        if (!doc) {
            return null;
        }

        const targetAddress = doc.contractAddress || config.contracts.bondAddress;

        // Safety check
        if (targetAddress && targetAddress.toLowerCase() !== contractAddress.toLowerCase()) {
            // This might happen if we fetched based on "default" fallback logical path
        }

        const onChain = await this.fetchOnChainData(targetAddress!);

        return {
            ...this.mapDocToPartial(doc),
            contractAddress: targetAddress!,
            totalSupply: onChain?.totalSupply || '0',
            totalBackedValue: onChain?.totalBackedValue || '0',
            symbol: onChain?.symbol || 'BOND',
        };
    }

    /**
     * Get bond details by ID (internal helper)
     */
    async getBondById(bondId: string): Promise<any | null> {
        const doc = await Bond.findOne({ bondId });
        return doc ? this.mapDocToPartial(doc) : null;
    }

    // Kept for backward compatibility if needed, but made async now
    // NOTE: This changes signature from synchronous to Promise!
    // Callers must await.
    async getBondByIdSync(bondId: string): Promise<any | undefined> {
        return this.getBondById(bondId);
    }

    /**
     * Get debt status (supply vs backed value) for all bonds
     */
    async getDebtStatus(): Promise<{
        totalDebtIssued: number;
        totalAssetBacking: number;
        isHealthy: boolean;
        timestamp: string;
    }> {
        const bonds = await this.listBonds();

        let totalDebt = 0;
        let totalBacking = 0;

        for (const bond of bonds) {
            totalDebt += parseFloat(bond.totalSupply) || 0;
            totalBacking += parseFloat(bond.totalBackedValue) || 0;
        }

        return {
            totalDebtIssued: totalDebt,
            totalAssetBacking: totalBacking,
            isHealthy: totalDebt <= totalBacking,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get user portfolio summary
     */
    async getPortfolio(userAddress: string): Promise<PortfolioDto> {
        const dbBonds = await Bond.find({});
        const holdings: PortfolioHolding[] = [];
        let totalValue = 0;
        let weightedApySum = 0;

        for (const rb of dbBonds) {
            try {
                const targetAddress = rb.contractAddress || config.contracts.bondAddress;
                if (!targetAddress) continue;

                const contract = new ethers.Contract(targetAddress, BOND_ABI, this.provider);
                const balanceBig = await contract.balanceOf(userAddress);

                if (balanceBig > BigInt(0)) {
                    const balance = parseFloat(ethers.formatUnits(balanceBig, 18));
                    const value = balance;

                    holdings.push({
                        bondId: rb.bondId,
                        bondName: rb.bondName,
                        symbol: 'GBOND',
                        balance: balance,
                        value: value,
                        apy: rb.couponRate,
                        maturityDate: rb.maturityDate ? rb.maturityDate.toISOString() : '',
                        nextPaymentDate: rb.startDate ? rb.startDate.toISOString() : undefined
                    });

                    totalValue += value;
                    weightedApySum += value * rb.couponRate;
                }
            } catch (error) {
                console.error(`[BondService] Failed to fetch balance for ${rb.contractAddress}:`, error);
            }
        }

        const averageApy = totalValue > 0 ? weightedApySum / totalValue : 0;
        const nextMaturity = holdings
            .map(h => h.maturityDate)
            .filter(d => d)
            .sort()[0] || null;

        return {
            totalValue,
            currency: 'USDC',
            averageApy,
            nextMaturityDate: nextMaturity,
            holdings
        };
    }
    /**
     * Sync/Grant Admin Roles for a specific wallet on all managed bonds
     */
    async syncAdminRoles(targetWallet: string): Promise<{ success: number; failed: number; details: any[] }> {
        const dbBonds = await Bond.find({});
        let successCount = 0;
        let failCount = 0;
        const details: any[] = [];

        console.log(`[BondService] Syncing admin roles for ${targetWallet} across ${dbBonds.length} bonds...`);

        const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
        const backendWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        for (const bond of dbBonds) {
            const bondAddr = bond.contractAddress || config.contracts.bondAddress;
            if (!bondAddr) continue;

            const targets = [
                { name: 'Bond', address: bondAddr },
                { name: 'Treasury', address: bond.treasuryAddress },
                { name: 'Distributor', address: bond.distributorAddress }
            ];

            for (const target of targets) {
                if (!target.address) continue;

                try {
                    const contract = new ethers.Contract(
                        target.address,
                        [
                            "function hasRole(bytes32, address) view returns (bool)",
                            "function grantRole(bytes32, address) external"
                        ],
                        backendWallet
                    );

                    const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, targetWallet);

                    if (hasRole) {
                        details.push({ bondId: bond.bondId, target: target.name, status: 'already_has_role' });
                        successCount++;
                    } else {
                        console.log(`[BondService] Granting ADMIN on ${bond.bondId} ${target.name} (${target.address}) to ${targetWallet}...`);
                        const tx = await contract.grantRole(DEFAULT_ADMIN_ROLE, targetWallet);
                        await tx.wait();
                        console.log(`[BondService] Role granted.`);

                        details.push({ bondId: bond.bondId, target: target.name, status: 'granted', txHash: tx.hash });
                        successCount++;
                    }
                } catch (error: any) {
                    console.error(`[BondService] Failed to grant role on ${bond.bondId} ${target.name}:`, error.message);
                    details.push({ bondId: bond.bondId, target: target.name, status: 'failed', error: error.message });
                    failCount++;
                }
            }
        }

        return { success: successCount, failed: failCount, details };
    }
}

export interface PortfolioDto {
    totalValue: number;
    currency: string;
    averageApy: number;
    nextMaturityDate: string | null;
    holdings: PortfolioHolding[];
}

export interface PortfolioHolding {
    bondId: string;
    bondName: string;
    symbol: string;
    balance: number;
    value: number;
    apy: number;
    maturityDate: string;
    nextPaymentDate?: string;
}
