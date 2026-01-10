"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BondService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    }
    /**
     * Load bond registry from JSON file
     */
    loadRegistry() {
        const registryPath = path.join(__dirname, '..', 'bond-registry.json');
        try {
            const data = fs.readFileSync(registryPath, 'utf-8');
            const parsed = JSON.parse(data);
            return parsed.bonds || [];
        }
        catch (error) {
            console.error('[BondService] Failed to load registry:', error);
            return [];
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
        const registryBonds = this.loadRegistry();
        const results = [];
        for (const rb of registryBonds) {
            const onChain = await this.fetchOnChainData(rb.contractAddress);
            results.push({
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
            });
        }
        return results;
    }
    /**
     * Get a single bond by contract address
     */
    async getBondByAddress(contractAddress) {
        const registryBonds = this.loadRegistry();
        const rb = registryBonds.find(b => b.contractAddress.toLowerCase() === contractAddress.toLowerCase());
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
    getBondByIdSync(bondId) {
        const registryBonds = this.loadRegistry();
        return registryBonds.find(b => b.bondId === bondId);
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
        const registryBonds = this.loadRegistry();
        const holdings = [];
        let totalValue = 0;
        let weightedApySum = 0;
        for (const rb of registryBonds) {
            try {
                const contract = new ethers_1.ethers.Contract(rb.contractAddress, BOND_ABI, this.provider);
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
                        nextPaymentDate: rb.startDate
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
            currency: 'USDC',
            averageApy,
            nextMaturityDate: nextMaturity,
            holdings
        };
    }
}
exports.BondService = BondService;
