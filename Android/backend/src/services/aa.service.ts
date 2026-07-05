import { ethers } from 'ethers';
import { config } from '../config';
import { BondService } from './bond.service';
import { DbService } from './db.service';

// --- ABIs ---

const TREASURY_SWAP_ABI = [
    "function buyFor(uint256 amount, address beneficiary) external",
    "function adminMint(address beneficiary, uint256 amount) external",
    "function withdrawReserves(address to, uint256 amount) external"
];

const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
];

const SOVEREIGN_BOND_ABI = [
    "function burn(address from, uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)"
];

const IDENTITY_REGISTRY_ABI = [
    "function isVerified(address wallet) external view returns (bool)"
];

const DISTRIBUTOR_ABI = [
    "function adminClaim(address beneficiary) external",
    "function claimableYield(address user) external view returns (uint256)"
];

export class AAService {
    private provider: ethers.JsonRpcProvider;
    private bondService: BondService;

    // Mutex to prevent nonce collisions with the single Admin Wallet
    private static mutex = Promise.resolve();

    /**
     * Executes an action with a mutex lock to ensure sequential execution.
     * Fixed: Wraps action in Promise.resolve() to handle synchronous errors gracefully.
     */
    private async withLock<T>(action: () => Promise<T>): Promise<T> {
        const result = AAService.mutex.then(() => Promise.resolve().then(action));
        // Catch errors so the chain continues for the next request
        AAService.mutex = result.then(() => { }).catch(() => { });
        return result;
    }

    /**
     * Helper to submit a transaction safely with proper nonce management.
     * Locks ONLY the submission part, allowing wait() to run unlocked for parallelism.
     */
    private async submitTx(action: () => Promise<ethers.ContractTransactionResponse>): Promise<ethers.ContractTransactionResponse> {
        return this.withLock(async () => action());
    }

    constructor(private dbService?: DbService) {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.bondService = new BondService();
    }

    /**
     * Backend-Sponsored Investment (Gasless) - PIPELINED VERSION
     * Flow:
     * 1. Check KYC
     * 2. Submit ALL 3 transactions with pre-calculated nonces (fast)
     * 3. Wait for all confirmations at once
     * 
     * COMPENSATION: If mint fails after transfer, refund from Treasury
     */
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030') {
        if (!config.admin.privateKey) throw new Error('Admin private key not configured');

        // 1. Resolve Data (unlocked - read operations)
        const bondData = await this.bondService.getBondById(bondId);
        if (!bondData || !bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

        const treasuryAddress = bondData.treasuryAddress;
        const usdtAddress = config.contracts.usdtAddress;
        const registryAddress = config.contracts.registryAddress;

        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);
        console.log(`[AAService] Processing investment for ${userAddress}: ${amount} USDT in ${bondId}`);

        // 2. Check KYC (unlocked - read operation)
        const registry = new ethers.Contract(registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        const isVerified = await registry.isVerified(userAddress);
        if (!isVerified) {
            throw new Error('KYC Verification Required.');
        }

        const usdt = new ethers.Contract(usdtAddress, USDT_ABI, adminWallet);
        const treasury = new ethers.Contract(treasuryAddress, TREASURY_SWAP_ABI, adminWallet);

        // Use parseUnits to avoid floating point precision errors
        const amountBig = ethers.parseUnits(amount.toString(), 6); // USDT is 6 decimals

        // Track state for compensation
        let usdtTransferred = false;

        // STEP 1: Permit (approve admin to spend user's USDT)
        console.log(`[AAService] Step 1/3: Submitting permit...`);
        const permitTx = await this.submitTx(async () => {
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            return usdt.permit(
                userAddress,
                adminWallet.address,
                amountBig,
                deadline,
                0, ethers.ZeroHash, ethers.ZeroHash
            );
        });
        await permitTx.wait();
        console.log(`[AAService] Permit confirmed: ${permitTx.hash}`);

        // STEP 2: Transfer USDT to Treasury
        console.log(`[AAService] Step 2/3: Transferring USDT...`);
        const transferTx = await this.submitTx(() =>
            usdt.transferFrom(userAddress, treasuryAddress, amountBig)
        );
        await transferTx.wait();
        usdtTransferred = true;
        console.log(`[AAService] Transfer confirmed: ${transferTx.hash}`);

        // STEP 3: Mint bonds (with compensation on failure)
        try {
            console.log(`[AAService] Step 3/3: Minting bonds...`);
            const investTx = await this.submitTx(() =>
                treasury.adminMint(userAddress, amountBig)
            );
            await investTx.wait();
            console.log(`[AAService] Investment complete: ${investTx.hash}`);

            // Record success
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
                message: `Invested ${amount} USDT in ${bondId}`
            };

        } catch (mintError: any) {
            // COMPENSATION: Mint failed after USDT transferred - REFUND!
            console.error(`[AAService] Mint failed: ${mintError.message}`);

            if (usdtTransferred) {
                console.log(`[AAService] Initiating USDT refund...`);
                try {
                    const refundTx = await this.submitTx(() =>
                        treasury.withdrawReserves(userAddress, amountBig)
                    );
                    await refundTx.wait();
                    console.log(`[AAService] USDT refunded: ${refundTx.hash}`);

                    if (this.dbService) {
                        await this.dbService.recordTransaction({
                            txHash: refundTx.hash,
                            userAddress,
                            type: 'INVEST',
                            amount: amount,
                            currency: 'USDT',
                            bondId,
                            status: 'REFUNDED'
                        });
                    }

                    throw new Error(`Investment failed but USDT was refunded. Original: ${mintError.message}`);
                } catch (refundError: any) {
                    if (refundError.message.includes('refunded')) {
                        throw refundError;
                    }
                    console.error(`[AAService] CRITICAL: Refund failed: ${refundError.message}`);

                    if (this.dbService) {
                        await this.dbService.recordTransaction({
                            txHash: 'REFUND_FAILED',
                            userAddress,
                            type: 'INVEST',
                            amount: amount,
                            currency: 'USDT',
                            bondId,
                            status: 'NEEDS_MANUAL_REFUND'
                        });
                    }
                    throw new Error(`CRITICAL: Investment and refund both failed. Manual intervention required.`);
                }
            }
            throw mintError;
        }
    }



    /**
     * Backend-Sponsored Redemption (Gasless) - ATOMIC VERSION
     * Flow:
     * 1. Check KYC
     * 2. Check treasury has enough USDT
     * 3. Burn User's Bond
     * 4. Send USDT from Treasury -> User
     * 
     * NOTE: Pre-check treasury balance to avoid burning bonds when payment would fail
     */
    async redeem(userAddress: string, bondAmount: string, bondId: string = 'GOI-2030') {
        if (!config.admin.privateKey) throw new Error('Admin key not configured');

        // Resolve data (unlocked)
        const bondData = await this.bondService.getBondById(bondId);
        if (!bondData || !bondData.treasuryAddress) throw new Error(`Configuration missing for: ${bondId}`);

        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        // 1. KYC Check (unlocked)
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        if (!(await registry.isVerified(userAddress))) {
            throw new Error(`User ${userAddress} is not KYC verified.`);
        }

        const bond = new ethers.Contract(bondData.contractAddress, SOVEREIGN_BOND_ABI, adminWallet);
        const treasury = new ethers.Contract(bondData.treasuryAddress, TREASURY_SWAP_ABI, adminWallet);
        const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, adminWallet);

        // GBOND = 18 decimals, USDT = 6 decimals
        const bondAmountBig = ethers.parseUnits(bondAmount, 18);
        const usdtAmountBig = ethers.parseUnits(bondAmount, 6);

        // 2. PRE-CHECK: Verify treasury has enough USDT before burning bonds
        const treasuryBalance = await usdt.balanceOf(bondData.treasuryAddress);
        if (treasuryBalance < usdtAmountBig) {
            throw new Error(`Treasury has insufficient USDT. Required: ${bondAmount}, Available: ${ethers.formatUnits(treasuryBalance, 6)}`);
        }
        console.log(`[AAService] Treasury balance verified: ${ethers.formatUnits(treasuryBalance, 6)} USDT`);

        console.log(`[AAService] Redeeming ${bondAmount} GBOND for ${userAddress}...`);

        // 3. Burn Bonds - LOCKED SUBMISSION
        console.log(`[AAService] Step 1/2: Burning bonds...`);
        const burnTx = await this.submitTx(() => bond.burn(userAddress, bondAmountBig));
        await burnTx.wait();
        console.log(`[AAService] Bonds burned: ${burnTx.hash}`);

        // 4. Pay User - LOCKED SUBMISSION
        console.log(`[AAService] Step 2/2: Sending USDT payment...`);
        const payTx = await this.submitTx(() =>
            treasury.withdrawReserves(userAddress, usdtAmountBig)
        );
        await payTx.wait();
        console.log(`[AAService] USDT sent to user: ${payTx.hash}`);

        if (this.dbService) {
            await this.dbService.recordTransaction({
                txHash: payTx.hash,
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
            txHash: payTx.hash,
            message: `Redeemed ${bondAmount} GBOND`
        };
    }


    /**
     * Backend-Sponsored Yield Claim (Gasless)
     * Fixed: Added KYC check and missing bondId in record
     */
    async claim(userAddress: string, bondId: string = 'GOI-2030') {
        if (!config.admin.privateKey) throw new Error('Admin key not configured');

        const bondData = await this.bondService.getBondById(bondId);
        if (!bondData || !bondData.distributorAddress) throw new Error(`Distributor missing for: ${bondId}`);

        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        // 1. KYC Check (unlocked - read operation)
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        if (!(await registry.isVerified(userAddress))) {
            throw new Error(`User ${userAddress} is not KYC verified.`);
        }

        const distributor = new ethers.Contract(bondData.distributorAddress, DISTRIBUTOR_ABI, adminWallet);

        // Check claimable amount first (unlocked - read operation)
        const claimable = await distributor.claimableYield(userAddress);
        const claimableFormatted = parseFloat(ethers.formatUnits(claimable, 6));

        if (claimableFormatted <= 0) {
            throw new Error('No yield available to claim.');
        }

        console.log(`[AAService] Claiming ${claimableFormatted} USDT for ${userAddress}`);

        // Submit claim transaction - LOCKED SUBMISSION
        const tx = await this.submitTx(() => distributor.adminClaim(userAddress));
        console.log(`[AAService] Claim submitted: ${tx.hash}`);

        await tx.wait();
        console.log(`[AAService] Claim confirmed: ${tx.hash}`);

        if (this.dbService) {
            await this.dbService.recordTransaction({
                txHash: tx.hash,
                userAddress,
                type: 'CLAIM',
                amount: claimableFormatted,
                currency: 'USDT',
                bondId: bondId,
                status: 'SUCCESS'
            });
        }

        return {
            success: true,
            txHash: tx.hash,
            amount: claimableFormatted,
            message: `Yield claimed successfully`
        };
    }

    /**
     * Mint USDT helper for Faucet (Demo Only)
     */
    async mintUSDT(to: string, amount: number) {
        if (!config.admin.privateKey) throw new Error("Admin key required");

        const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

        // KYC Check (unlocked - read operation)
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        if (!(await registry.isVerified(to))) {
            throw new Error(`User ${to} must be KYC verified to use the faucet.`);
        }

        const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, adminWallet);
        const amountBig = ethers.parseUnits(amount.toString(), 6);

        console.log(`[AAService] Minting ${amount} USDT on faucet for ${to}`);

        // Submit mint - LOCKED SUBMISSION
        const tx = await this.submitTx(() => usdt.mint(to, amountBig));
        await tx.wait();
        console.log(`[AAService] Faucet mint confirmed: ${tx.hash}`);

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
    }

    /**
     * View Only: Get Claimable Yield
     */
    async getClaimableYield(userAddress: string, bondId: string = 'GOI-2030'): Promise<number> {
        try {
            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData || !bondData.distributorAddress) return 0;

            const distributor = new ethers.Contract(bondData.distributorAddress, DISTRIBUTOR_ABI, this.provider);
            const claimableAmount = await distributor.claimableYield(userAddress);

            return parseFloat(ethers.formatUnits(claimableAmount, 6));
        } catch (error: any) {
            console.error(`[AAService] getClaimableYield failed:`, error.message);
            return 0;
        }
    }
}