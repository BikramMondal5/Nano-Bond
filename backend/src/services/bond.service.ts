import { ethers } from 'ethers';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

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

// Registry bond entry (from JSON file)
interface RegistryBond {
    bondId: string;
    bondName: string;
    issuer: string;
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
}

// API response format
export interface BondDto {
    bondId: string;
    bondName: string;
    issuer: string;
    contractAddress: string;
    treasuryAddress?: string;
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

export class BondService {
    private provider: ethers.JsonRpcProvider;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
    }

    /**
     * Load bond registry from JSON file
     */
    private loadRegistry(): RegistryBond[] {
        const registryPath = path.join(process.cwd(), 'bond-registry.json');
        try {
            const data = fs.readFileSync(registryPath, 'utf-8');
            const parsed = JSON.parse(data);
            const bonds = parsed.bonds || [];
            console.log(`[BondService] Loaded ${bonds.length} bonds from registry at ${registryPath}`);
            return bonds;
        } catch (error) {
            console.error('[BondService] Failed to load registry:', error);
            return [];
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
     * List all bonds from registry with on-chain data
     */
    async listBonds(): Promise<BondDto[]> {
        const registryBonds = this.loadRegistry();
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
    async getBondByAddress(contractAddress: string): Promise<BondDto | null> {
        const registryBonds = this.loadRegistry();
        const rb = registryBonds.find(
            b => {
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
    getBondByIdSync(bondId: string): RegistryBond | undefined {
        const registryBonds = this.loadRegistry();
        return registryBonds.find(b => b.bondId === bondId);
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
        const registryBonds = this.loadRegistry();
        const holdings: PortfolioHolding[] = [];
        let totalValue = 0;
        let weightedApySum = 0;

        for (const rb of registryBonds) {
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
                        maturityDate: rb.maturityDate || '',
                        nextPaymentDate: rb.startDate
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
