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
    async invest(userAddress: string, amount: number, bondId: string = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config.admin.privateKey) {
                throw new Error('Admin private key not configured');
            }

            // Resolve Bond
            const bondData = this.bondService.getBondByIdSync(bondId);
            if (!bondData) throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress) throw new Error(`Treasury not configured for: ${bondId}`);

            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless investment for ${userAddress}: ${amount} USDT in ${bondId}`);

            // Admin wallet executes the transaction
            const adminWallet = new ethers.Wallet(config.admin.privateKey, this.provider);

            // 1. Check KYC and auto-register if needed
            const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            const isVerified = await registry.isVerified(userAddress);

            if (!isVerified) {
                console.log(`[AAService] User ${userAddress} not KYC verified. Auto-registering...`);
                const idHash = ethers.keccak256(ethers.toUtf8Bytes(`AUTO-${userAddress}-${Date.now()}`));
                const registerTx = await registry.register(userAddress, idHash);
                await registerTx.wait();
                console.log(`[AAService] KYC registered: ${registerTx.hash}`);
            }

            // 2. Call adminMint on Treasury
            const treasury = new ethers.Contract(treasuryAddress, TREASURY_SWAP_ABI, adminWallet);
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals

            console.log(`[AAService] Calling adminMint for ${userAddress} with amount ${amountBig}...`);

            try {
                const investTx = await treasury.adminMint(userAddress, amountBig);
                const receipt = await investTx.wait();
                console.log(`[AAService] Investment confirmed: ${investTx.hash}`);

                return {
                    success: true,
                    txHash: investTx.hash,
                    message: `Invested ${amount} USDT in ${bondId} (gasless)`
                };
            } catch (error: any) {
                console.error(`[AAService] adminMint failed:`, error.message);

                // Check for common errors
                if (error.message?.includes('ExceedsBackedLogic')) {
                    throw new Error('Investment exceeds available bond backing. Admin needs to add more assets.');
                }
                if (error.message?.includes('NotVerified')) {
                    throw new Error('KYC verification failed. Please try again.');
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
}
