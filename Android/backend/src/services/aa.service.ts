import { ethers } from 'ethers';
import { config } from '../config';
import { BondService } from './bond.service';

// Treasury Swap ABI for investing
const TREASURY_SWAP_ABI = [
    "function buyFor(uint256 amount, address beneficiary) external",
    "function adminMint(address beneficiary, uint256 amount) external",
];

const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
];

const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
];

import { DbService } from './db.service';

export class AAService {
    private provider: ethers.JsonRpcProvider;
    private bondService: BondService;

    private static mutex = Promise.resolve();

    private async withLock<T>(action: () => Promise<T>): Promise<T> {
        const result = AAService.mutex.then(() => action());
        // Catch errors so the chain continues
        AAService.mutex = result.then(() => { }).catch(() => { });
        return result;
    }

    constructor(private dbService?: DbService) {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.bondService = new BondService();
    }

    /**
     * Backend-Sponsored Investment (Gasless)
     * 1. Auto-registers user for KYC if not verified
     * 2. Mints bonds directly to the user
     */
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) {
                throw new Error('Admin private key not configured');
            }

            // Resolve Bond
            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            // Check for Gateway Address
            const gatewayAddress = config.contracts.gatewayAddress;
            if (!gatewayAddress) throw new Error('Investment Gateway not configured in backend');

            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless investment for ${userAddress}: ${amount} USDT in ${bondId}`);

            // Admin wallet executes the transaction
            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            // 1. Check KYC
            const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            const isVerified = await registry.isVerified(userAddress);

            if (!isVerified) {
                console.warn(`[AAService] User ${userAddress} is not verified. Transaction rejected.`);
                throw new Error('KYC Verification Required. Please complete verification in the app.');
            }

            // 2. Prepare Investment via Gateway
            const treasury = new ethers.Contract(treasuryAddress, TREASURY_SWAP_ABI, adminWallet);
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals

            console.log(`[AAService] Calling Treasury adminMint for ${userAddress} amount ${amountBig}...`);

            try {
                // Use adminMint directly for gasless investment (Demo Mode / Admin Sponsored)
                // This bypasses the need for Gateway permits if the Gateway contract is not fully set up.
                const investTx = await treasury.adminMint(
                    userAddress,
                    amountBig
                );

                const receipt = await investTx.wait();
                console.log(`[AAService] Investment confirmed: ${investTx.hash}`);

                if (this.dbService) {
                    await this.dbService.recordTransaction({
                        txHash: investTx.hash,
                        userAddress,
                        type: 'INVEST',
                        amount: amount,
                        currency: 'USDT',
                        bondId,
                        status: 'SUCCESS'
                    });
                }

                return {
                    success: true,
                    txHash: investTx.hash,
                    message: `Invested ${amount} USDT in ${bondId} (gasless)`
                };
            } catch (error: any) {
                console.error(`[AAService] Investment failed:`, error.message);
                throw error;
            }
        });
    }

    /**
     * Mint USDT helper for Faucet
     */
    async mintUSDT(to: string, amount: number) {
        return this.withLock(async () => {
            if (!config.admin.privateKey) {
                throw new Error("Admin key required for faucet");
            }
            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);
            const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, adminWallet);

            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals
            const tx = await usdt.mint(to, amountBig);
            await tx.wait();

            // Record deposit/faucet transaction
            if (this.dbService) {
                await this.dbService.recordTransaction({
                    txHash: tx.hash,
                    userAddress: to,
                    type: 'DEPOSIT',
                    amount: amount,
                    currency: 'USDT',
                    status: 'SUCCESS'
                });
            }

            return tx.hash;
        });
    }

    /**
     * Backend-Sponsored Redemption (Gasless)
     */
    async redeem(userAddress: string, bondAmount: string, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) throw new Error('Admin key not configured');

            // Resolve Bond
            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless redemption for ${userAddress}: ${bondAmount} GBOND`);

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            const TREASURY_REDEEM_ABI = [
                "function adminRedeem(address user, uint256 bondAmount) external"
            ];

            const treasury = new ethers.Contract(treasuryAddress, TREASURY_REDEEM_ABI, adminWallet);
            const amountBig = ethers.parseUnits(bondAmount, 18); // GBOND has 18 decimals

            try {
                const tx = await treasury.adminRedeem(userAddress, amountBig);
                console.log(`[AAService] Redemption TX sent: ${tx.hash}`);
                await tx.wait();
                console.log(`[AAService] Redemption confirmed`);

                if (this.dbService) {
                    await this.dbService.recordTransaction({
                        txHash: tx.hash,
                        userAddress,
                        type: 'REDEEM',
                        amount: parseFloat(bondAmount),
                        currency: 'GBOND',
                        bondId,
                        status: 'SUCCESS'
                    });
                }

                return {
                    success: true,
                    txHash: tx.hash,
                    message: `Redeemed ${bondAmount} GBOND (gasless)`
                };
            } catch (error: any) {
                console.error(`[AAService] adminRedeem failed:`, error.message);
                if (error.message?.includes('Bond not matured')) {
                    throw new Error('Bond has not matured yet.');
                }
                throw error;
            }
        });
    }

    /**
     * Backend-Sponsored Yield Claim (Gasless)
     */
    async claim(userAddress: string, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) throw new Error('Admin key not configured');

            // Resolve Bond
            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            // Note: Bond Registry has "distributorAddress" but we might need to fetch it from the bond data structure in bondService
            // The JSON structure has it.

            const distributorAddress = bondData.distributorAddress;
            if (!distributorAddress) throw new Error(`Distributor not configured for: ${bondId}`);

            console.log(`[AAService] Processing gasless claim for ${userAddress}`);

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            const DISTRIBUTOR_CLAIM_ABI = [
                "function adminClaim(address beneficiary) external",
                "function claimableYield(address user) external view returns (uint256)"
            ];

            const distributor = new ethers.Contract(distributorAddress, DISTRIBUTOR_CLAIM_ABI, adminWallet);

            try {
                // Fetch claimable amount first
                const claimableAmount = await distributor.claimableYield(userAddress);
                const formattedAmount = parseFloat(ethers.formatUnits(claimableAmount, 6)); // USDT is 6 decimals

                if (formattedAmount <= 0) {
                    throw new Error('No yield available to claim.');
                }

                console.log(`[AAService] Claiming yield for ${userAddress}: ${formattedAmount} USDT`);

                const tx = await distributor.adminClaim(userAddress);
                console.log(`[AAService] Claim TX sent: ${tx.hash}`);
                await tx.wait();
                console.log(`[AAService] Claim confirmed`);

                if (this.dbService) {
                    await this.dbService.recordTransaction({
                        txHash: tx.hash,
                        userAddress,
                        type: 'CLAIM',
                        amount: formattedAmount,
                        currency: 'USDT',
                        status: 'SUCCESS'
                    });
                }

                return {
                    success: true,
                    txHash: tx.hash,
                    amount: formattedAmount,
                    message: `Yield claimed successfully`
                };
            } catch (error: any) {
                console.error(`[AAService] adminClaim failed:`, error.message);
                // "Nothing to claim" is the Revert reason from contract
                if (error.message?.includes('Nothing to claim') || error.message?.includes('execution reverted')) {
                    // Try to be helpful. If revert, it's likely 0 yield.
                    // But we checked claimableAmount? 
                    // If claimableAmount > 0 and it fails, it's a real error.
                    // If claimableAmount == 0, we can throw early actually.
                }

                if (error.message?.includes('Nothing to claim')) {
                    throw new Error('No yield available to claim.');
                }

                throw error;
            }
        });
    }
    /**
     * Get Claimable Yield (View Only)
     */
    async getClaimableYield(userAddress: string, bondId: string = 'GOI-2030'): Promise<number> {
        try {
            // Resolve Bond
            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData) return 0;
            const distributorAddress = bondData.distributorAddress;
            if (!distributorAddress) return 0; // No distributor = no yield

            const DISTRIBUTOR_VIEW_ABI = [
                "function claimableYield(address user) external view returns (uint256)"
            ];

            const distributor = new ethers.Contract(distributorAddress, DISTRIBUTOR_VIEW_ABI, this.provider);
            const claimableAmount = await distributor.claimableYield(userAddress);

            return parseFloat(ethers.formatUnits(claimableAmount, 6)); // USDT 6 decimals
        } catch (error: any) {
            console.error(`[AAService] getClaimableYield failed:`, error.message);
            return 0;
        }
    }
}

