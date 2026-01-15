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
            // Seed initial data if collection is empty
            const count = await this.bondsCollection.countDocuments();
            if (count === 0) {
                await this.seedInitialBonds();
            }
        }
        catch (error) {
            console.error('[BondService] Failed to connect to MongoDB:', error);
        }
    }
    /**
     * Seed initial bond data (migrated from JSON)
     */
    async seedInitialBonds() {
        if (!this.bondsCollection)
            return;
        const initialBonds = [
            {
                bondId: "GOI-2030",
                bondName: "GOI Bond 2030",
                issuer: "Govt of India",
                category: "Sovereign",
                contractAddress: "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02",
                distributorAddress: "0x956D938378484AbADf0873ca7bC94c0203e76584",
                treasuryAddress: "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11",
                couponRate: 7.5,
                minInvestment: 100,
                maxSubscription: 1000000,
                startDate: "2024-01-01",
                maturityDate: "2030-01-01",
                description: "Government of India Sovereign Bond maturing in 2030 with 7.5% annual yield.",
                proofUrl: "https://rbi.org.in/sovereign-bonds"
            },
            {
                bondId: "INFRA-28",
                bondName: "Solar Infra Bond 2028",
                issuer: "Min. of New & Renewable Energy",
                category: "Green Bond",
                contractAddress: "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02",
                couponRate: 8.2,
                startDate: "2024-06-01",
                maturityDate: "2028-06-01",
                minInvestment: 500,
                maxSubscription: 200000,
                description: "Green Energy financing bond for solar parks across Gujarat and Rajasthan.",
                proofUrl: "https://mnre.gov.in/green-bonds"
            },
            {
                bondId: "HOU-2027",
                bondName: "Housing Dev Bond 2027",
                issuer: "NHB (National Housing Bank)",
                category: "Social",
                contractAddress: "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02",
                couponRate: 6.8,
                startDate: "2024-02-15",
                maturityDate: "2027-02-15",
                minInvestment: 1000,
                maxSubscription: 50000,
                description: "Supporting affordable housing projects for EWS and LIG categories.",
                proofUrl: "https://nhb.org.in/bonds"
            },
            {
                bondId: "HWY-2029",
                bondName: "Highway Infra 2029",
                issuer: "NHAI (National Highways)",
                category: "Infrastructure",
                contractAddress: "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02",
                couponRate: 7.9,
                startDate: "2024-04-01",
                maturityDate: "2029-04-01",
                minInvestment: 200,
                maxSubscription: 500000,
                description: "Tax-free bonds for financing national highway expansion projects.",
                proofUrl: "https://nhai.gov.in/bonds"
            }
        ];
        try {
            await this.bondsCollection.insertMany(initialBonds);
            console.log('[BondService] Seeded initial bond data to MongoDB');
        }
        catch (error) {
            console.error('[BondService] Failed to seed initial bonds:', error);
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
                totalSupply: ethers_1.ethers.formatUnits(totalSupply, 6),
                totalBackedValue: ethers_1.ethers.formatUnits(totalBackedValue, 6),
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
                contractAddress: targetAddress,
                treasuryAddress: rb.treasuryAddress,
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
            contractAddress: rb.contractAddress,
            treasuryAddress: rb.treasuryAddress,
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
                const balanceBig = await contract.balanceOf(userAddress);
                if (balanceBig > BigInt(0)) {
                    const balance = parseFloat(ethers_1.ethers.formatUnits(balanceBig, 18));
                    const value = balance;
                    holdings.push({
                        bondId: rb.bondId,
                        bondName: rb.bondName,
                        symbol: 'GBOND',
                        balance: balance,
                        value: value,
                        apy: rb.couponRate,
                        maturityDate: rb.maturityDate || '',
                        nextPaymentDate: rb.startDate,
                        proofUrl: rb.proofUrl
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
