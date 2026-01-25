import { ethers } from 'ethers';
import { config } from '../config';
import { MongoClient, Db, Collection } from 'mongodb';

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

// Distributor ABI for checking claimable yield
const DISTRIBUTOR_ABI = [
    "function claimableYield(address user) external view returns (uint256)"
];

// Registry bond entry (from JSON file)
interface RegistryBond {
    bondId: string;
    bondName: string;
    issuer: string;
    adminWallet?: string;
    category?: string;
    contractAddress: string;
    treasuryAddress?: string;
    distributorAddress?: string;
    couponRate: number;
    minInvestment: number;
    maxSubscription: number;
    startDate?: string;
    maturityDate?: string;
    description?: string;
    proofUrl?: string;
    status?: 'locked' | 'unlocked'; // Admin-controlled lock/unlock for withdrawals
}

// API response format
export interface BondDto {
    bondId: string;
    bondName: string;
    issuer: string;
    adminWallet?: string;
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
    maturityDateOnChain?: number;
}

export class BondService {
    private provider: ethers.JsonRpcProvider;
    private mongoClient: MongoClient | null = null;
    private db: Db | null = null;
    private bondsCollection: Collection<RegistryBond> | null = null;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.initMongoDB();
    }

    /**
     * Initialize MongoDB connection
     */
    private async initMongoDB() {
        if (!config.mongodb.uri) {
            console.warn('[BondService] No MONGODB_URI found. Bond registry will be empty.');
            return;
        }

        try {
            this.mongoClient = new MongoClient(config.mongodb.uri);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('govtbond');
            this.bondsCollection = this.db.collection<RegistryBond>('bonds');
            console.log('[BondService] Connected to MongoDB successfully');
        } catch (error) {
            console.error('[BondService] Failed to connect to MongoDB:', error);
        }
    }

    /**
     * Load bond registry from MongoDB
     */
    private async loadRegistry(): Promise<RegistryBond[]> {
        if (!this.bondsCollection) {
            console.warn('[BondService] MongoDB not connected, returning empty registry');
            return [];
        }

        try {
            const bonds = await this.bondsCollection.find({}).toArray();
            console.log(`[BondService] Loaded ${bonds.length} bonds from MongoDB`);
            return bonds;
        } catch (error) {
            console.error('[BondService] Failed to load registry from MongoDB:', error);
            return [];
        }
    }

    /**
     * Add a new bond to the registry
     */
    async addBond(bond: RegistryBond): Promise<RegistryBond> {
        if (!this.bondsCollection) {
            throw new Error('MongoDB not connected');
        }

        try {
            // Validate if exists
            const existing = await this.bondsCollection.findOne({ bondId: bond.bondId });
            if (existing) {
                throw new Error(`Bond ID ${bond.bondId} already exists`);
            }

            await this.bondsCollection.insertOne(bond);
            console.log(`[BondService] Added new bond ${bond.bondId} to MongoDB`);
            return bond;
        } catch (error) {
            console.error('[BondService] Failed to add bond:', error);
            throw error;
        }
    }

    /**
     * Set bond lock/unlock status for withdrawals
     */
    async setBondStatus(bondId: string, status: 'locked' | 'unlocked'): Promise<boolean> {
        if (!this.bondsCollection) {
            throw new Error('MongoDB not connected');
        }

        try {
            const result = await this.bondsCollection.updateOne(
                { bondId },
                { $set: { status } }
            );

            if (result.matchedCount === 0) {
                console.warn(`[BondService] Bond ${bondId} not found for status update`);
                return false;
            }

            console.log(`[BondService] Bond ${bondId} status set to ${status}`);
            return true;
        } catch (error) {
            console.error('[BondService] Failed to set bond status:', error);
            throw error;
        }
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
                totalSupply: ethers.formatUnits(totalSupply, 18),  // Bond tokens have 18 decimals
                totalBackedValue: ethers.formatUnits(totalBackedValue, 18),  // Bond tokens have 18 decimals
                maturityDateOnChain: Number(maturityDateOnChain),
            };
        } catch (error) {
            console.error(`[BondService] Failed to fetch on-chain data for ${contractAddress}:`, error);
            return null;
        }
    }

    /**
     * List all bonds from registry with on-chain data
     */
    async listBonds(): Promise<BondDto[]> {
        const registryBonds = await this.loadRegistry();
        const results: BondDto[] = [];

        for (const rb of registryBonds) {
            // Fallback: If registry doesn't specify a contract, use the default Sovereign Bond address
            const targetAddress = rb.contractAddress || config.contracts.bondAddress;
            if (!targetAddress) continue; // Skip if no address available at all

            const onChain = await this.fetchOnChainData(targetAddress);

            results.push({
                bondId: rb.bondId,
                bondName: rb.bondName,
                issuer: rb.issuer,
                adminWallet: rb.adminWallet,
                contractAddress: targetAddress,
                treasuryAddress: rb.treasuryAddress,
                distributorAddress: rb.distributorAddress,
                couponRate: rb.couponRate,
                minInvestment: rb.minInvestment,
                maxSubscription: rb.maxSubscription,
                startDate: rb.startDate || null,
                maturityDate: rb.maturityDate || null,
                description: rb.description || null,
                proofUrl: rb.proofUrl || null,
                totalSupply: onChain?.totalSupply || '0',
                totalBackedValue: onChain?.totalBackedValue || '0',
                symbol: onChain?.symbol || 'BOND',
                maturityDateOnChain: onChain?.maturityDateOnChain,
            });
        }

        return results;
    }

    /**
     * Get a single bond by contract address
     */
    async getBondByAddress(contractAddress: string): Promise<BondDto | null> {
        const registryBonds = await this.loadRegistry();
        const rb = registryBonds.find(
            (b: RegistryBond) => {
                const addr = b.contractAddress || config.contracts.bondAddress;
                return addr && addr.toLowerCase() === contractAddress.toLowerCase();
            }
        );

        if (!rb) {
            return null;
        }

        const onChain = await this.fetchOnChainData(rb.contractAddress);

        return {
            bondId: rb.bondId,
            bondName: rb.bondName,
            issuer: rb.issuer,
            adminWallet: rb.adminWallet,
            contractAddress: rb.contractAddress,
            treasuryAddress: rb.treasuryAddress,
            distributorAddress: rb.distributorAddress,
            couponRate: rb.couponRate,
            minInvestment: rb.minInvestment,
            maxSubscription: rb.maxSubscription,
            startDate: rb.startDate || null,
            maturityDate: rb.maturityDate || null,
            description: rb.description || null,
            proofUrl: rb.proofUrl || null,
            totalSupply: onChain?.totalSupply || '0',
            totalBackedValue: onChain?.totalBackedValue || '0',
            symbol: onChain?.symbol || 'BOND',
            maturityDateOnChain: onChain?.maturityDateOnChain,
        };
    }

    /**
     * Get bond details by ID (internal helper)
     */
    async getBondById(bondId: string): Promise<RegistryBond | undefined> {
        const registryBonds = await this.loadRegistry();
        return registryBonds.find((b: RegistryBond) => b.bondId === bondId);
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
        const registryBonds = await this.loadRegistry();
        const holdings: PortfolioHolding[] = [];
        let totalValue = 0;
        let weightedApySum = 0;

        for (const rb of registryBonds) {
            try {
                const targetAddress = rb.contractAddress || config.contracts.bondAddress;
                if (!targetAddress) continue;

                const contract = new ethers.Contract(targetAddress, BOND_ABI, this.provider);

                // Fetch balance and on-chain maturity date in parallel
                const [balanceBig, maturityTimestamp] = await Promise.all([
                    contract.balanceOf(userAddress),
                    contract.maturityDate().catch(() => BigInt(0))
                ]);

                if (balanceBig > BigInt(0)) {
                    const balance = parseFloat(ethers.formatUnits(balanceBig, 18));
                    const value = balance;

                    // Determine unlock status from on-chain maturity (blockchain is source of truth)
                    const nowTimestamp = Math.floor(Date.now() / 1000);
                    const maturityTs = Number(maturityTimestamp);
                    const isUnlocked = maturityTs > 0 && nowTimestamp >= maturityTs;

                    // Fetch claimable yield if distributor is configured
                    let claimableYield = 0;
                    if (rb.distributorAddress) {
                        try {
                            const distributor = new ethers.Contract(rb.distributorAddress, DISTRIBUTOR_ABI, this.provider);
                            const claimableAmount = await distributor.claimableYield(userAddress);
                            claimableYield = parseFloat(ethers.formatUnits(claimableAmount, 6)); // USDT 6 decimals
                        } catch (e) {
                            console.warn(`[BondService] Failed to fetch claimable yield for ${rb.bondId}`);
                        }
                    }

                    holdings.push({
                        bondId: rb.bondId,
                        bondName: rb.bondName,
                        symbol: 'GBOND',
                        balance: balance,
                        value: value,
                        apy: rb.couponRate,
                        maturityDate: maturityTs > 0 ? new Date(maturityTs * 1000).toISOString() : (rb.maturityDate || ''),
                        nextPaymentDate: rb.startDate,
                        proofUrl: rb.proofUrl,
                        status: isUnlocked ? 'unlocked' : 'locked',
                        distributorAddress: rb.distributorAddress,
                        claimableYield: claimableYield,
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
            currency: 'USDT',
            averageApy,
            nextMaturityDate: nextMaturity,
            holdings
        };
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
    proofUrl?: string | null;
    status?: 'locked' | 'unlocked';
    distributorAddress?: string;
    claimableYield?: number;
}
