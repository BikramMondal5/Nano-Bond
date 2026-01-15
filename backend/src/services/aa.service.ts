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
    "function adminBurn(address from, uint256 amount) external",
];

const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
];

export class AAService {
    private provider: ethers.JsonRpcProvider;
    private bondService: BondService;

    private static mutex = Promise.resolve();

    /**
     * Executes an action within the global mutex lock.
     * Use this ONLY for operations that must be sequential (like nonce assignment).
     * Do NOT await long-running tasks (like confirmation) inside here.
     */
    private async withLock<T>(action: () => Promise<T>): Promise<T> {
        const result = AAService.mutex.then(() => action());
        // Catch errors so the chain continues
        AAService.mutex = result.then(() => { }).catch(() => { });
        return result;
    }

    /**
     * Helper to submit a transaction safely with proper nonce management.
     * Locks ONLY the submission part.
     */
    private async submitTx(action: () => Promise<ethers.ContractTransactionResponse>): Promise<ethers.ContractTransactionResponse> {
        return this.withLock(async () => {
            // Accessing nonce logic inside here ensures sequence
            return action();
        });
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
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030', requestId?: string, timestamp?: number, signature?: string) {
        // 0. Verify Signature (Security) - Unlocked
        if (!signature || !timestamp || !requestId) {
            console.warn('[AAService] Missing signature/timestamp/requestId. Allowing for legacy dev, but UNSAFE.');
        } else {
            const payload = `INVEST:${userAddress}:${amount}:${bondId}:${requestId}:${timestamp}`;
            const signer = ethers.verifyMessage(payload, signature);
            if (signer.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error("Invalid signature. You are not authorized.");
            }
            if (Date.now() - timestamp > 5 * 60 * 1000) {
                throw new Error("Request expired");
            }
        }

        if (!config.admin.privateKey) {
            throw new Error('Admin private key not configured');
        }

        // Resolve Bond - Unlocked
        const bondData = await this.bondService.getBondByIdSync(bondId);
        if (!bondData) throw new Error(`Bond not found: ${bondId}`);
        if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);
        const treasuryAddress = bondData.treasuryAddress;

        // Check for Gateway Address
        if (!config.contracts.gatewayAddress) throw new Error('Investment Gateway not configured in backend');

        console.log(`[AAService] Processing gasless investment for ${userAddress}: ${amount} USDT in ${bondId}`);
        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        // 1. Check KYC - Unlocked
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        const isVerified = await registry.isVerified(userAddress);

        if (!isVerified) {
            throw new Error(`User ${userAddress} is not KYC verified. Complete KYC first.`);
        }

        // 1.5 Check Idempotency - Unlocked
        if (requestId) {
            const existing = await Investment.findOne({ requestId });
            if (existing && existing.status === 'SUCCESS') {
                return {
                    success: true,
                    txHash: existing.txHash,
                    message: 'Transaction already processed',
                    newBalance: 0
                };
            }
            // If PENDING, we might want to block or return "Processing"
            if (existing && existing.status === 'PENDING') {
                throw new Error("Transaction currently processing");
            }
        }

        try {
            // 2. Check user USDT balance first - Unlocked
            const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, adminWallet);
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals

            const userBalance = await usdt.balanceOf(userAddress);
            if (userBalance < amountBig) {
                throw new Error(`Insufficient USDT balance. Required: ${amount}, Available: ${Number(userBalance) / 1000000}`);
            }

            // 3. Burn USDT - LOCKED SUBMISSION
            console.log(`[AAService] Burning ${amount} USDT from ${userAddress}...`);
            const burnTx = await this.submitTx(() => usdt.adminBurn(userAddress, amountBig));

            // WAIT UNLOCKED (Allows other users to proceed)
            console.log(`[AAService] Waiting for Burn confirmation: ${burnTx.hash}`);
            await burnTx.wait();
            console.log(`[AAService] USDT burned: ${burnTx.hash}`);

            // 4. Mint bonds - LOCKED SUBMISSION
            const TREASURY_ABI = [
                "function adminMint(address beneficiary, uint256 amount) external"
            ];
            const treasury = new ethers.Contract(treasuryAddress, TREASURY_ABI, adminWallet);

            console.log(`[AAService] Minting bonds to ${userAddress}...`);
            const investTx = await this.submitTx(() => treasury.adminMint(userAddress, amountBig));

            // 4.5 Save PENDING State (Ghost Investment Fix)
            let investmentRecord = null;
            try {
                investmentRecord = await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'INVEST',
                    amount: amount,
                    txHash: investTx.hash,
                    status: 'PENDING',
                    requestId: requestId || undefined
                });
                console.log(`[AAService] Investment recorded as PENDING: ${investTx.hash}`);
            } catch (dbErr) {
                console.error(`[AAService] Failed to save PENDING investment:`, dbErr);
                // Critical error but we proceed to wait for tx?
                // If we don't save pending, and crash, we have Ghost.
                // We should try to save?
            }

            // WAIT UNLOCKED
            console.log(`[AAService] Waiting for Mint confirmation: ${investTx.hash}`);
            await investTx.wait();
            console.log(`[AAService] Investment confirmed: ${investTx.hash}`);

            // 5. Update DB to SUCCESS
            if (investmentRecord) {
                investmentRecord.status = 'SUCCESS';
                await investmentRecord.save();
            } else {
                // Try to create if pending failed?
                await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'INVEST',
                    amount: amount,
                    txHash: investTx.hash,
                    status: 'SUCCESS',
                    requestId: requestId || undefined
                });
            }

            // 6. Return new balance (Optimistic)
            const remaining = BigInt(userBalance) - amountBig;
            const newBalance = Number(remaining) / 1000000;

            return {
                success: true,
                txHash: investTx.hash,
                message: `Invested ${amount} USDT in ${bondId} (gasless)`,
                newBalance: newBalance
            };

        } catch (error: any) {
            console.error(`[AAService] Investment failed:`, error.message);
            // If we have a pending record and it failed ON CHAIN (revert), update to FAILED
            if (requestId) {
                const pending = await Investment.findOne({ requestId, status: 'PENDING' });
                if (pending) {
                    pending.status = 'FAILED';
                    await pending.save();
                }
            }

            if (error.message?.includes('Insufficient USDT')) {
                throw error;
            }
            if (error.message?.includes('ExceedsBackedLogic')) {
                throw new Error('Investment exceeds available bond backing.');
            }
            throw error;
        }
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
        if (!config.admin.privateKey) throw new Error('Admin key not configured');

        // Resolve Bond - Unlocked
        const bondData = await this.bondService.getBondByIdSync(bondId);
        if (!bondData) throw new Error(`Bond not found: ${bondId}`);
        if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

        const treasuryAddress = bondData.treasuryAddress;
        console.log(`[AAService] Processing gasless redemption for ${userAddress}: ${bondAmount} GBOND`);

        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        // Check KYC - Unlocked
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        const isVerified = await registry.isVerified(userAddress);
        if (!isVerified) {
            throw new Error(`User ${userAddress} is not KYC verified. Cannot redeem.`);
        }

        const TREASURY_REDEEM_ABI = [
            "function adminRedeem(address user, uint256 bondAmount) external"
        ];

        const treasury = new ethers.Contract(treasuryAddress, TREASURY_REDEEM_ABI, adminWallet);
        const amountBig = ethers.parseUnits(bondAmount, 18); // GBOND has 18 decimals

        try {
            // SUBMIT LOCKED
            const tx = await this.submitTx(() => treasury.adminRedeem(userAddress, amountBig));
            console.log(`[AAService] Redemption TX sent: ${tx.hash}`);

            // SAVE PENDING
            let record = null;
            try {
                record = await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'REDEEM',
                    amount: parseFloat(bondAmount),
                    txHash: tx.hash,
                    status: 'PENDING'
                });
            } catch (e) { console.error("DB Save Pending Failed", e); }

            // WAIT UNLOCKED
            await tx.wait();
            console.log(`[AAService] Redemption confirmed`);

            // UPDATE SUCCESS
            if (record) {
                record.status = 'SUCCESS';
                await record.save();
            } else {
                await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'REDEEM',
                    amount: parseFloat(bondAmount),
                    txHash: tx.hash,
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
    }

    /**
     * Backend-Sponsored Yield Claim (Gasless)
     */
    async claim(userAddress: string, bondId: string = 'GOI-2030') {
        if (!config.admin.privateKey) throw new Error('Admin key not configured');

        // Resolve Bond - Unlocked
        const bondData = await this.bondService.getBondByIdSync(bondId);
        if (!bondData) throw new Error(`Bond not found: ${bondId}`);

        const distributorAddress = bondData.distributorAddress || config.contracts.distributorAddress; // Fallback
        if (!distributorAddress) throw new Error(`Distributor not configured`);

        console.log(`[AAService] Processing gasless claim for ${userAddress}`);

        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        // Check KYC - Unlocked
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        const isVerified = await registry.isVerified(userAddress);
        if (!isVerified) {
            throw new Error(`User ${userAddress} is not KYC verified. Cannot claim yield.`);
        }

        const DISTRIBUTOR_CLAIM_ABI = [
            "function adminClaim(address beneficiary) external"
        ];

        const distributor = new ethers.Contract(distributorAddress, DISTRIBUTOR_CLAIM_ABI, adminWallet);

        try {
            // SUBMIT LOCKED
            const tx = await this.submitTx(() => distributor.adminClaim(userAddress));
            console.log(`[AAService] Claim TX sent: ${tx.hash}`);

            // SAVE PENDING
            let record = null;
            try {
                record = await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'CLAIM',
                    amount: 0,
                    txHash: tx.hash,
                    status: 'PENDING'
                });
            } catch (e) { console.error("DB Pending Save Failed", e); }

            // WAIT UNLOCKED
            await tx.wait();
            console.log(`[AAService] Claim confirmed`);

            // UPDATE SUCCESS
            if (record) {
                record.status = 'SUCCESS';
                await record.save();
            } else {
                await Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'CLAIM',
                    amount: 0,
                    txHash: tx.hash,
                    status: 'SUCCESS'
                });
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
    }
}
