"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BondService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const Bond_1 = require("../models/Bond");
const deployment_service_1 = require("./deployment.service");
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
        this.deploymentService = new deployment_service_1.DeploymentService();
    }
    /**
     * Deploy new contracts for a bond (Low Level)
     */
    async deployBondContracts(bondId, bondName) {
        return await this.deploymentService.deployBondProduct(bondName, bondId);
    }
    /**
     * Create a fully managed bond: Deploy -> Link -> Grant Admin -> Save DB
     */
    async createManagedBond(details, ownerAddress) {
        console.log(`[BondService] Creating managed bond: ${details.bondId} for owner ${ownerAddress}`);
        // 1. Deploy Contracts
        const deployment = await this.deploymentService.deployBondProduct(details.bondName, details.bondId);
        console.log(`[BondService] Deployed at: ${deployment.contractAddress}`);
        // ===============================================
        // SYSTEMIC SAFEGUARD: Post-Deployment Verification
        // ===============================================
        try {
            console.log(`[BondService] VERIFYING Treasury Config for ${details.bondId}...`);
            const treasuryContract = new ethers_1.ethers.Contract(deployment.treasuryAddress, ["function paymentToken() view returns (address)"], this.provider);
            const onChainUSDT = await treasuryContract.paymentToken();
            const expectedUSDT = config_1.config.contracts.usdtAddress;
            if (onChainUSDT.toLowerCase() !== expectedUSDT.toLowerCase()) {
                const errorMsg = `CRITICAL DEPLOYMENT FAILURE: Treasury USDT Mismatch! Expected ${expectedUSDT}, Got ${onChainUSDT}`;
                console.error(`[BondService] ${errorMsg}`);
                throw new Error(errorMsg);
            }
            console.log(`[BondService] ✅ Treasury Verified (USDT: ${onChainUSDT})`);
        }
        catch (verifyError) {
            console.error(`[BondService] Verification Failed: ${verifyError.message}`);
            // We should arguably NOT save this bond to DB, or save as 'failed'
            throw new Error(`Deployment Verification Failed: ${verifyError.message}`);
        }
        try {
            console.log(`[BondService] VERIFYING Distributor Config for ${details.bondId}...`);
            const distContract = new ethers_1.ethers.Contract(deployment.distributorAddress, ["function paymentToken() view returns (address)"], this.provider);
            const distUSDT = await distContract.paymentToken();
            const expectedUSDT = config_1.config.contracts.usdtAddress;
            if (distUSDT.toLowerCase() !== expectedUSDT.toLowerCase()) {
                const errorMsg = `CRITICAL DEPLOYMENT FAILURE: Distributor USDT Mismatch! Expected ${expectedUSDT}, Got ${distUSDT}`;
                console.error(`[BondService] ${errorMsg}`);
                throw new Error(errorMsg);
            }
            console.log(`[BondService] ✅ Distributor Verified (USDT: ${distUSDT})`);
        }
        catch (verifyError) {
            console.error(`[BondService] Distributor Verification Failed: ${verifyError.message}`);
            throw new Error(`Deployment Verification Failed (Distributor): ${verifyError.message}`);
        }
        // ===============================================
        // 2. Grant DEFAULT_ADMIN_ROLE to Owner
        // DEFAULT_ADMIN_ROLE is 0x00...00
        const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
        const bondContract = new ethers_1.ethers.Contract(deployment.contractAddress, ["function grantRole(bytes32, address) external"], new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider));
        console.log(`[BondService] Granting ADMIN role to ${ownerAddress}...`);
        const tx = await bondContract.grantRole(DEFAULT_ADMIN_ROLE, ownerAddress);
        await tx.wait();
        console.log(`[BondService] Role Granted.`);
        // 3. Save to DB
        // Check if exists
        let bondDoc = await Bond_1.Bond.findOne({ bondId: details.bondId });
        if (!bondDoc) {
            bondDoc = new Bond_1.Bond({
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
                status: 'active' // or 'pending_backing'
            });
        }
        else {
            // Update existing
            bondDoc.contractAddress = deployment.contractAddress;
            bondDoc.treasuryAddress = deployment.treasuryAddress;
            bondDoc.distributorAddress = deployment.distributorAddress;
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
    mapDocToPartial(doc) {
        return {
            bondId: doc.bondId,
            bondName: doc.bondName,
            issuer: doc.issuer,
            contractAddress: doc.contractAddress || config_1.config.contracts.bondAddress,
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
     * List all bonds from DB with on-chain data
     */
    async listBonds() {
        const dbBonds = await Bond_1.Bond.find({});
        const results = [];
        for (const b of dbBonds) {
            // Fallback: If registry doesn't specify a contract, use the default Sovereign Bond address
            const targetAddress = b.contractAddress || config_1.config.contracts.bondAddress;
            if (!targetAddress)
                continue; // Skip if no address available at all
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
    async getBondByAddress(contractAddress) {
        // We might not be able to query by contractAddress directly if it's dynamic or fallback
        // So we might search all and filter, or add contractAddress to schema index
        // Since we have low volume, findOne based on precise match first
        let doc = await Bond_1.Bond.findOne({ contractAddress: { $regex: new RegExp(`^${contractAddress}$`, 'i') } });
        // If not found, it might be using the default address but not stored in DB with it?
        // But logic says if DB entry has NO address, it uses default.
        if (!doc) {
            // If the queried address IS the default address, we might return the first bond that uses it?
            // Or maybe we should improve the query. For now, let's just stick to DB structure.
            // If you query for a specific address, we expect it to be in the DB or be the default one.
            if (config_1.config.contracts.bondAddress && contractAddress.toLowerCase() === config_1.config.contracts.bondAddress.toLowerCase()) {
                // Return the first one that has no address or matching address
                doc = await Bond_1.Bond.findOne({
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
        const targetAddress = doc.contractAddress || config_1.config.contracts.bondAddress;
        // Safety check
        if (targetAddress && targetAddress.toLowerCase() !== contractAddress.toLowerCase()) {
            // This might happen if we fetched based on "default" fallback logical path
        }
        const onChain = await this.fetchOnChainData(targetAddress);
        return {
            ...this.mapDocToPartial(doc),
            contractAddress: targetAddress,
            totalSupply: onChain?.totalSupply || '0',
            totalBackedValue: onChain?.totalBackedValue || '0',
            symbol: onChain?.symbol || 'BOND',
        };
    }
    /**
     * Get bond details by ID (internal helper)
     */
    async getBondById(bondId) {
        const doc = await Bond_1.Bond.findOne({ bondId });
        return doc ? this.mapDocToPartial(doc) : null;
    }
    // Kept for backward compatibility if needed, but made async now
    // NOTE: This changes signature from synchronous to Promise!
    // Callers must await.
    async getBondByIdSync(bondId) {
        return this.getBondById(bondId);
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
        const dbBonds = await Bond_1.Bond.find({});
        const holdings = [];
        let totalValue = 0;
        let weightedApySum = 0;
        for (const rb of dbBonds) {
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
                        maturityDate: rb.maturityDate ? rb.maturityDate.toISOString() : '',
                        nextPaymentDate: rb.startDate ? rb.startDate.toISOString() : undefined
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
