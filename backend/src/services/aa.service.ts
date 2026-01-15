import { ethers } from 'ethers';
import { config } from '../config';
import { BondService } from './bond.service';
import { Investment } from '../models/Investment';

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
    "function burn(address from, uint256 amount) external",
];

const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
];

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

    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.bondService = new BondService();
    }

    /**
     * Backend-Sponsored Investment (Unified Flow)
     * Flow:
     * 1. Check/Register KYC on Source Network (if verified registry exists)
     * 2. Burn USDT from User on Source Network (Deduction)
     * 3. Mint USDT to Admin on Mantle (Funding)
     * 4. Admin Approves Treasury on Mantle
     * 5. Admin calls Treasury.buyFor() on Mantle
     * 
     * This ensures all investments for a specific Bond ID go to the specific Treasury used by that Bond,
     * allowing for granular balance tracking on the Dashboard.
     */
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030', network: string = 'mantle') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) {
                throw new Error('Admin private key not configured');
            }

            console.log(`[AAService] Processing investment for ${userAddress}: ${amount} USDT in ${bondId} on ${network}`);

            // Network-specific configuration
            const NETWORK_CONFIG: Record<string, { rpc: string; registry: string; usdt: string }> = {
                mantle: {
                    rpc: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
                    registry: config.contracts.registryAddress,
                    usdt: process.env.USDT_ADDRESS || '0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1'
                },
                polygon: {
                    rpc: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
                    registry: process.env.POLYGON_IDENTITY_REGISTRY || config.contracts.registryAddress,
                    usdt: process.env.USDT_POLYGON || '0x9565c705f598Af4B477CCf9C8390BFCD8634E919'
                },
                ethereum: {
                    rpc: process.env.ETHEREUM_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/SGDMqyFwTPXrua62HtYyM',
                    registry: '',
                    usdt: process.env.USDT_ETHEREUM || '0x9C497178995f70d1A5cbf33225Fc0D8B15469F8a'
                },
                arbitrum: {
                    rpc: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
                    registry: '',
                    usdt: process.env.USDT_ARBITRUM || '0x17830508db410b208F38641b57C723fCBa41c68b'
                },
                scroll: {
                    rpc: process.env.SCROLL_RPC_URL || 'https://sepolia-rpc.scroll.io',
                    registry: '',
                    usdt: process.env.USDT_SCROLL || '0x71678089A61FA4bcC64182693df2709DB6B115Fd'
                }
            };

            const networkConfig = NETWORK_CONFIG[network];
            if (!networkConfig) {
                throw new Error(`Unsupported network: ${network}`);
            }

            // Use network-specific provider
            const networkProvider = new ethers.JsonRpcProvider(networkConfig.rpc);
            const adminWallet = new ethers.Wallet(config.admin.privateKey, networkProvider);

            // Resolve Bond
            const bondData = await this.bondService.getBondByIdSync(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            const treasuryAddress = bondData.treasuryAddress;
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals

            // 1. Check KYC (Auto-verify if possible/needed)
            if (networkConfig.registry && (network === 'mantle' || network === 'polygon')) {
                const registry = new ethers.Contract(networkConfig.registry, IDENTITY_REGISTRY_ABI, adminWallet);
                try {
                    const isVerified = await registry.isVerified(userAddress);
                    if (!isVerified) {
                        console.log(`[AAService] User ${userAddress} not KYC verified on ${network}. Auto-registering...`);
                        const idHash = ethers.keccak256(ethers.toUtf8Bytes(`AUTO-${userAddress}-${Date.now()}`));
                        const registerTx = await registry.register(userAddress, idHash);
                        await registerTx.wait();
                        console.log(`[AAService] KYC registered: ${registerTx.hash}`);
                    }
                } catch (kycErr) {
                    console.warn(`[AAService] KYC check skipped/failed on ${network} (might be not deployed):`, kycErr);
                }
            }

            // 2. BURN FUNDS ON SOURCE NETWORK
            try {
                console.log(`[AAService] Deducting funds from user on ${network}...`);

                const usdt = new ethers.Contract(networkConfig.usdt, USDT_ABI, adminWallet);

                // Use extended MockUSDT burn (admin burns from user)
                const burnTx = await usdt.burn(userAddress, amountBig);
                await burnTx.wait();
                console.log(`[AAService] Burned ${amount} USDT from user on ${network}: ${burnTx.hash}`);
            } catch (burnErr: any) {
                console.error(`[AAService] Failed to burn user funds on ${network}:`, burnErr.message);
                if (burnErr.message?.includes('balance')) {
                    throw new Error(`Insufficient USDT balance on ${network}.`);
                }
                throw new Error(`Failed to deduct USDT on ${network}. Ensure you have balance.`);
            }

            // 3. MINT TO ADMIN ON MANTLE (Liquidity movement simulation)
            // Use Mantle Provider always
            const mantleProvider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz');
            const mantleAdminWallet = new ethers.Wallet(config.admin.privateKey, mantleProvider);

            // Mantle USDT
            const mantleUsdtAddress = process.env.USDT_ADDRESS || '0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1';
            const mantleUsdt = new ethers.Contract(mantleUsdtAddress, USDT_ABI, mantleAdminWallet);

            const mantleMintTx = await mantleUsdt.mint(mantleAdminWallet.address, amountBig);
            await mantleMintTx.wait();
            console.log(`[AAService] Minted ${amount} USDT to admin wallet on Mantle`);

            // 4. APPROVE TREASURY ON MANTLE
            // CRITICAL: Use the specific Treasury Address for this Bond ID!
            const approveTx = await mantleUsdt.approve(treasuryAddress, amountBig);
            await approveTx.wait();
            console.log(`[AAService] Approved Treasury ${treasuryAddress} to spend USDT on Mantle`);

            // 5. BUY BOND ON MANTLE
            const treasury = new ethers.Contract(
                treasuryAddress,
                TREASURY_SWAP_ABI,
                mantleAdminWallet
            );

            const investTx = await treasury.buyFor(amountBig, userAddress);
            await investTx.wait();
            console.log(`[AAService] Investment confirmed on Mantle: ${investTx.hash}`);

            // 6. SAVE TO DB
            try {
                await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'INVEST',
                    amount: amount,
                    txHash: investTx.hash,
                    status: 'SUCCESS',
                    network: network
                });
                console.log(`[AAService] Investment recorded in DB`);
            } catch (dbErr) {
                console.error(`[AAService] Failed to save investment to DB:`, dbErr);
            }

            return {
                success: true,
                txHash: investTx.hash,
                message: `Invested ${amount} USDT in ${bondId} on ${network} (gasless)`
            };
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
            const bondData = await this.bondService.getBondByIdSync(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless redemption for ${userAddress}: ${bondAmount} GBOND in ${bondId}`);

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

                // PERSIST REDEMPTION TO MONGODB
                try {
                    await Investment.create({
                        walletAddress: userAddress,
                        bondId: bondId,
                        type: 'REDEEM',
                        amount: parseFloat(bondAmount),
                        txHash: tx.hash,
                        status: 'SUCCESS'
                    });
                } catch (dbErr) {
                    console.error('[AAService] Failed to save redemption to DB', dbErr);
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
            const bondData = await this.bondService.getBondByIdSync(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);

            const distributorAddress = bondData.distributorAddress || config.contracts.distributorAddress; // Fallback
            if (!distributorAddress) throw new Error(`Distributor not configured`);

            console.log(`[AAService] Processing gasless claim for ${userAddress} in ${bondId}`);

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            const DISTRIBUTOR_CLAIM_ABI = [
                "function adminClaim(address beneficiary) external"
            ];

            const distributor = new ethers.Contract(distributorAddress, DISTRIBUTOR_CLAIM_ABI, adminWallet);

            try {
                const tx = await distributor.adminClaim(userAddress);
                console.log(`[AAService] Claim TX sent: ${tx.hash}`);
                await tx.wait();
                console.log(`[AAService] Claim confirmed`);

                // PERSIST CLAIM TO MONGODB
                try {
                    await Investment.create({
                        walletAddress: userAddress,
                        bondId: bondId,
                        type: 'CLAIM',
                        amount: 0, // Yield amount is unknown here without parsing logs
                        txHash: tx.hash,
                        status: 'SUCCESS'
                    });
                } catch (dbErr) {
                    console.error('[AAService] Failed to save claim to DB', dbErr);
                }

                return {
                    success: true,
                    txHash: tx.hash,
                    message: `Yield claimed successfully (gasless)`
                };
            } catch (error: any) {
                console.error(`[AAService] adminClaim failed:`, error.message);
                if (error.message?.includes('Nothing to claim')) {
                    throw new Error('No yield available to claim.');
                }
                throw error;
            }
        });
    }
}
