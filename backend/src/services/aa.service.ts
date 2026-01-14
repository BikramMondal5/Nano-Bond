import { ethers } from 'ethers';
import { config } from '../config';
import { BondService } from './bond.service';
import { Investment } from '../models/Investment';

// ... (ABIs remains the same) ...
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
     * Backend-Sponsored Investment (Gasless)
     * 1. Auto-registers user for KYC if not verified
     * 2. Mints bonds directly to the user
     */
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030', network: string = 'mantle') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) {
                throw new Error('Admin private key not configured');
            }

            // Network-specific configuration
            const NETWORK_CONFIG: Record<string, { rpc: string; gateway: string; registry: string }> = {
                mantle: {
                    rpc: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
                    gateway: config.contracts.gatewayAddress,
                    registry: config.contracts.registryAddress
                },
                polygon: {
                    rpc: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
                    gateway: process.env.POLYGON_INVESTMENT_GATEWAY || '0xD89fBa38c81f543C6fC47EF74D75b2405201A33D',
                    registry: process.env.POLYGON_IDENTITY_REGISTRY || config.contracts.registryAddress
                }
            };

            const networkConfig = NETWORK_CONFIG[network];
            if (!networkConfig) {
                throw new Error(`Unsupported network: ${network}`);
            }

            if (!networkConfig.gateway) {
                throw new Error(`Investment Gateway not configured for ${network}`);
            }

            // Use network-specific provider
            const networkProvider = new ethers.JsonRpcProvider(networkConfig.rpc);
            const adminWallet = new ethers.Wallet(config.admin.privateKey, networkProvider);

            // Resolve Bond
            const bondData = await this.bondService.getBondByIdSync(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless investment for ${userAddress}: ${amount} USDT in ${bondId} on ${network}`);

            // 1. Check KYC (skip for now on Polygon if registry not deployed)
            if (networkConfig.registry && network === 'mantle') {
                const registry = new ethers.Contract(networkConfig.registry, IDENTITY_REGISTRY_ABI, adminWallet);
                const isVerified = await registry.isVerified(userAddress);

                if (!isVerified) {
                    console.log(`[AAService] User ${userAddress} not KYC verified. Auto-registering...`);
                    const idHash = ethers.keccak256(ethers.toUtf8Bytes(`AUTO-${userAddress}-${Date.now()}`));
                    const registerTx = await registry.register(userAddress, idHash);
                    await registerTx.wait();
                    console.log(`[AAService] KYC registered: ${registerTx.hash}`);
                }
            }

            // 2. Prepare Investment via Gateway
            const GATEWAY_ABI = [
                "function investWithPermit(address user, uint256 amount, address treasury, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
            ];

            const gateway = new ethers.Contract(networkConfig.gateway, GATEWAY_ABI, adminWallet);
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals

            // Generate Dummy Permit (Since MockUSDT is in Demo Mode)
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const dummyV = 27;
            const dummyR = ethers.ZeroHash;
            const dummyS = ethers.ZeroHash;

            console.log(`[AAService] Calling Gateway for ${userAddress} amount ${amountBig}...`);

            try {
                // For Polygon: Admin-funded direct investment (bypass gateway)
                if (network === 'polygon') {
                    console.log(`[AAService] Using admin-funded direct investment for ${network}`);

                    // Mint USDT to admin wallet
                    const usdt = new ethers.Contract(
                        process.env.USDT_POLYGON || '0x9565c705f598Af4B477CCf9C8390BFCD8634E919',
                        USDT_ABI,
                        adminWallet
                    );

                    const mintTx = await usdt.mint(adminWallet.address, amountBig);
                    await mintTx.wait();
                    console.log(`[AAService] Minted ${amount} USDT to admin wallet`);

                    // Approve Treasury
                    const approveTx = await usdt.approve(treasuryAddress, amountBig);
                    await approveTx.wait();
                    console.log(`[AAService] Approved Treasury to spend USDT`);

                    // Call Treasury.buyFor() directly
                    const treasury = new ethers.Contract(
                        treasuryAddress,
                        ["function buyFor(uint256 amount, address beneficiary) external"],
                        adminWallet
                    );

                    const investTx = await treasury.buyFor(amountBig, userAddress);
                    await investTx.wait();
                    console.log(`[AAService] Investment confirmed: ${investTx.hash}`);

                    // Save to DB
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
                }

                // For Mantle: Use InvestmentGateway (original flow)
                const investTx = await gateway.investWithPermit(
                    userAddress,
                    amountBig,
                    treasuryAddress,
                    deadline,
                    dummyV,
                    dummyR,
                    dummyS
                );

                const receipt = await investTx.wait();
                console.log(`[AAService] Investment confirmed: ${investTx.hash}`);

                // PERSIST TRANSACTION TO MONGODB
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
            } catch (error: any) {
                console.error(`[AAService] Gateway invest failed:`, error.message);

                if (error.message?.includes('ExceedsBackedLogic')) {
                    throw new Error('Investment exceeds available bond backing.');
                }
                if (error.message?.includes('transfer amount exceeds balance')) {
                    throw new Error('User has insufficient USDT balance.');
                }
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

            console.log(`[AAService] Processing gasless claim for ${userAddress}`);

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
