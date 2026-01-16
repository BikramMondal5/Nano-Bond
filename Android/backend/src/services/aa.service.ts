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

    constructor(private dbService?: DbService) {
        this.provider = new ethers.JsonRpcProvider(config.rpc.url);
        this.bondService = new BondService();
    }

    /**
     * Backend-Sponsored Investment (Gasless)
     * Real World Logic:
     * 1. Check KYC
     * 2. Move USDT from User -> Treasury (via Permit + TransferFrom)
     * 3. Mint Bond to User (via adminMint)
     */
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) throw new Error('Admin private key not configured');

            // 1. Resolve Data
            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData || !bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            const treasuryAddress = bondData.treasuryAddress;
            const usdtAddress = config.contracts.usdtAddress;
            const registryAddress = config.contracts.registryAddress;

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);
            console.log(`[AAService] Processing investment for ${userAddress}: ${amount} USDT in ${bondId}`);

            // 2. Check KYC
            const registry = new ethers.Contract(registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            const isVerified = await registry.isVerified(userAddress);
            if (!isVerified) {
                throw new Error('KYC Verification Required.');
            }

            const usdt = new ethers.Contract(usdtAddress, USDT_ABI, adminWallet);
            const treasury = new ethers.Contract(treasuryAddress, TREASURY_SWAP_ABI, adminWallet);

            // Fixed: Use parseUnits to avoid floating point precision errors
            const amountBig = ethers.parseUnits(amount.toString(), 6); // USDT is 6 decimals

            try {
                // 3. Fake Permit (Demo Only)
                // In production, the user would sign a permit off-chain and send r,s,v here.
                const deadline = Math.floor(Date.now() / 1000) + 3600;
                // Approve ADMIN to spend User's funds - Get explicit nonce
                const permitNonce = await adminWallet.getNonce();
                const permitTx = await usdt.permit(
                    userAddress,
                    adminWallet.address,
                    amountBig,
                    deadline,
                    0, // v
                    ethers.ZeroHash, // r
                    ethers.ZeroHash,  // s
                    { nonce: permitNonce }
                );
                await permitTx.wait();
                console.log(`[AAService] Permit/Approve successful`);

                // 4. Transfer USDT: User -> Treasury - Get fresh nonce
                const transferNonce = await adminWallet.getNonce();
                const transferTx = await usdt.transferFrom(userAddress, treasuryAddress, amountBig, { nonce: transferNonce });
                await transferTx.wait();
                console.log(`[AAService] USDT transferred to Treasury: ${transferTx.hash}`);

                // 5. Mint Bond - Get fresh nonce
                const mintNonce = await adminWallet.getNonce();
                const investTx = await treasury.adminMint(userAddress, amountBig, { nonce: mintNonce });
                await investTx.wait();
                console.log(`[AAService] Bond minted: ${investTx.hash}`);

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

            } catch (error: any) {
                console.error(`[AAService] Investment failed:`, error.message);
                throw error;
            }
        });
    }

    /**
     * Backend-Sponsored Redemption (Gasless)
     * Real World Logic:
     * 1. Check KYC
     * 2. Burn User's Bond (Admin has MINTER_ROLE)
     * 3. Send USDT from Treasury -> User (Admin has DEFAULT_ADMIN_ROLE to withdraw)
     */
    async redeem(userAddress: string, bondAmount: string, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) throw new Error('Admin key not configured');

            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData || !bondData.treasuryAddress) throw new Error(`Configuration missing for: ${bondId}`);

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            // 1. KYC Check
            const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            if (!(await registry.isVerified(userAddress))) {
                throw new Error(`User ${userAddress} is not KYC verified.`);
            }

            const bond = new ethers.Contract(bondData.contractAddress, SOVEREIGN_BOND_ABI, adminWallet);
            const treasury = new ethers.Contract(bondData.treasuryAddress, TREASURY_SWAP_ABI, adminWallet);

            // GBOND = 18 decimals, USDT = 6 decimals
            // Fixed: use parseUnits for both to ensure precision
            const bondAmountBig = ethers.parseUnits(bondAmount, 18);
            const usdtAmountBig = ethers.parseUnits(bondAmount, 6);

            try {
                console.log(`[AAService] Redeeming ${bondAmount} GBOND for ${userAddress}...`);

                // 2. Burn Bonds - Get explicit nonce
                const burnNonce = await adminWallet.getNonce();
                const burnTx = await bond.burn(userAddress, bondAmountBig, { nonce: burnNonce });
                await burnTx.wait();
                console.log(`[AAService] Bonds burned: ${burnTx.hash}`);

                // 3. Pay User (Withdraw from Treasury Reserve) - Get fresh nonce after burn confirms
                const payNonce = await adminWallet.getNonce();
                const payTx = await treasury.withdrawReserves(userAddress, usdtAmountBig, { nonce: payNonce });
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

            } catch (error: any) {
                console.error(`[AAService] Redeem failed:`, error.message);
                throw error;
            }
        });
    }

    /**
     * Backend-Sponsored Yield Claim (Gasless)
     * Fixed: Added KYC check and missing bondId in record
     */
    async claim(userAddress: string, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) throw new Error('Admin key not configured');

            const bondData = await this.bondService.getBondById(bondId);
            if (!bondData || !bondData.distributorAddress) throw new Error(`Distributor missing for: ${bondId}`);

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            // 1. KYC Check (Fixed: Added missing security check)
            const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            if (!(await registry.isVerified(userAddress))) {
                throw new Error(`User ${userAddress} is not KYC verified.`);
            }

            const distributor = new ethers.Contract(bondData.distributorAddress, DISTRIBUTOR_ABI, adminWallet);

            try {
                // Check amount first
                const claimable = await distributor.claimableYield(userAddress);
                const claimableFormatted = parseFloat(ethers.formatUnits(claimable, 6));

                if (claimableFormatted <= 0) {
                    throw new Error('No yield available to claim.');
                }

                console.log(`[AAService] Claiming ${claimableFormatted} USDT for ${userAddress}`);

                const tx = await distributor.adminClaim(userAddress);
                await tx.wait();

                if (this.dbService) {
                    // Fixed: Added missing bondId field
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
            } catch (error: any) {
                console.error(`[AAService] Claim failed:`, error.message);
                throw error;
            }
        });
    }

    /**
     * Mint USDT helper for Faucet (Demo Only)
     * Fixed: Added KYC check and proper math
     */
    async mintUSDT(to: string, amount: number) {
        return this.withLock(async () => {
            if (!config.admin.privateKey) throw new Error("Admin key required");

            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            // 1. KYC Check (Fixed: Added as per bug report)
            const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            if (!(await registry.isVerified(to))) {
                throw new Error(`User ${to} must be KYC verified to use the faucet.`);
            }

            const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, adminWallet);

            // Fixed: Use parseUnits
            const amountBig = ethers.parseUnits(amount.toString(), 6); // 6 decimals

            const tx = await usdt.mint(to, amountBig);
            await tx.wait();

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