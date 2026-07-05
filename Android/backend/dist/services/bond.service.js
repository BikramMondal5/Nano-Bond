"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BondService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const mongodb_1 = require("mongodb");
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
class BondService {
    constructor() {
        this.mongoClient = null;
        this.db = null;
        this.bondsCollection = null;
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
        this.initMongoDB();
    }
    /**
     * Initialize MongoDB connection
     */
    async initMongoDB() {
        if (!config_1.config.mongodb.uri) {
            console.warn('[BondService] No MONGODB_URI found. Bond registry will be empty.');
            return;
        }
        try {
            this.mongoClient = new mongodb_1.MongoClient(config_1.config.mongodb.uri);
            await this.mongoClient.connect();
            this.db = this.mongoClient.db('govtbond');
            this.bondsCollection = this.db.collection('bonds');
            console.log('[BondService] Connected to MongoDB successfully');
        }
        catch (error) {
            console.error('[BondService] Failed to connect to MongoDB:', error);
        }
    }
    /**
     * Load bond registry from MongoDB
     */
    async loadRegistry() {
        if (!this.bondsCollection) {
            console.warn('[BondService] MongoDB not connected, returning empty registry');
            return [];
        }
        try {
            const bonds = await this.bondsCollection.find({}).toArray();
            console.log(`[BondService] Loaded ${bonds.length} bonds from MongoDB`);
            return bonds;
        }
        catch (error) {
            console.error('[BondService] Failed to load registry from MongoDB:', error);
            return [];
        }
    }
    /**
     * Add a new bond to the registry
     */
    async addBond(bond) {
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
        }
        catch (error) {
            console.error('[BondService] Failed to add bond:', error);
            throw error;
        }
    }
    /**
     * Set bond lock/unlock status for withdrawals
     */
    async setBondStatus(bondId, status) {
        if (!this.bondsCollection) {
            throw new Error('MongoDB not connected');
        }
        try {
            const result = await this.bondsCollection.updateOne({ bondId }, { $set: { status } });
            if (result.matchedCount === 0) {
                console.warn(`[BondService] Bond ${bondId} not found for status update`);
                return false;
            }
            console.log(`[BondService] Bond ${bondId} status set to ${status}`);
            return true;
        }
        catch (error) {
            console.error('[BondService] Failed to set bond status:', error);
            throw error;
        }
    }
    /**
     * Fetch on-chain data for a bond contract
     */
    async fetchOnChainData(contractAddress) {
        try {
            const contract = new ethers_1.ethers.Contract(contractAddress, BOND_ABI, this.provider);
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
                totalSupply: ethers_1.ethers.formatUnits(totalSupply, 18), // Bond tokens have 18 decimals
                totalBackedValue: ethers_1.ethers.formatUnits(totalBackedValue, 18), // Bond tokens have 18 decimals
                maturityDateOnChain: Number(maturityDateOnChain),
            };
        }
        catch (error) {
            console.error(`[BondService] Failed to fetch on-chain data for ${contractAddress}:`, error);
            return null;
        }
    }
    /**
     * List all bonds from registry with on-chain data
     */
    async listBonds() {
        const registryBonds = await this.loadRegistry();
        const results = [];
        for (const rb of registryBonds) {
            // Fallback: If registry doesn't specify a contract, use the default Sovereign Bond address
            const targetAddress = rb.contractAddress || config_1.config.contracts.bondAddress;
            if (!targetAddress)
                continue; // Skip if no address available at all
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
            });
        }
        return results;
    }
    /**
     * Get a single bond by contract address
     */
    async getBondByAddress(contractAddress) {
        const registryBonds = await this.loadRegistry();
        const rb = registryBonds.find((b) => {
            const addr = b.contractAddress || config_1.config.contracts.bondAddress;
            return addr && addr.toLowerCase() === contractAddress.toLowerCase();
        });
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
        };
    }
    /**
     * Get bond details by ID (internal helper)
     */
    async getBondById(bondId) {
        const registryBonds = await this.loadRegistry();
        return registryBonds.find((b) => b.bondId === bondId);
    }
    /**
     * Get debt status (supply vs backed value) for all bonds
     */
    async getDebtStatus() {
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
    async getPortfolio(userAddress) {
        const registryBonds = await this.loadRegistry();
        const holdings = [];
        let totalValue = 0;
        let weightedApySum = 0;
        for (const rb of registryBonds) {
            try {
                const targetAddress = rb.contractAddress || config_1.config.contracts.bondAddress;
                if (!targetAddress)
                    continue;
                const contract = new ethers_1.ethers.Contract(targetAddress, BOND_ABI, this.provider);
                // Fetch balance and on-chain maturity date in parallel
                const [balanceBig, maturityTimestamp] = await Promise.all([
                    contract.balanceOf(userAddress),
                    contract.maturityDate().catch(() => BigInt(0))
                ]);
                if (balanceBig > BigInt(0)) {
                    const balance = parseFloat(ethers_1.ethers.formatUnits(balanceBig, 18));
                    const value = balance;
                    // Determine unlock status from on-chain maturity (blockchain is source of truth)
                    const nowTimestamp = Math.floor(Date.now() / 1000);
                    const maturityTs = Number(maturityTimestamp);
                    const isUnlocked = maturityTs > 0 && nowTimestamp >= maturityTs;
                    holdings.push({
                        bondId: rb.bondId,
                        bondName: rb.bondName,
                        symbol: 'GBOND',
                        balance: balance,
                        value: value,
                        apy: rb.couponRate,
                        maturityDate: rb.maturityDate || '',
                        nextPaymentDate: rb.startDate,
                        proofUrl: rb.proofUrl,
                        status: isUnlocked ? 'unlocked' : 'locked', // From blockchain!
                    });
                    totalValue += value;
                    weightedApySum += value * rb.couponRate;
                }
            }
            catch (error) {
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
exports.BondService = BondService;
