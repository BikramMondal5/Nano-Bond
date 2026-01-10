"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AAService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const bond_service_1 = require("./bond.service");
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
class AAService {
    async withLock(action) {
        const result = AAService.mutex.then(() => action());
        // Catch errors so the chain continues
        AAService.mutex = result.then(() => { }).catch(() => { });
        return result;
    }
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
        this.bondService = new bond_service_1.BondService();
    }
    /**
     * Backend-Sponsored Investment (Gasless)
     * 1. Auto-registers user for KYC if not verified
     * 2. Mints bonds directly to the user
     */
    async invest(userAddress, amount, bondId = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config_1.config.admin.privateKey) {
                throw new Error('Admin private key not configured');
            }
            // Resolve Bond
            const bondData = this.bondService.getBondByIdSync(bondId);
            if (!bondData)
                throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress)
                throw new Error(`Treasury not configured for: ${bondId}`);
            // Check for Gateway Address
            const gatewayAddress = config_1.config.contracts.gatewayAddress;
            if (!gatewayAddress)
                throw new Error('Investment Gateway not configured in backend');
            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless investment for ${userAddress}: ${amount} USDT in ${bondId}`);
            // Admin wallet executes the transaction
            const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider);
            // 1. Check KYC
            const registry = new ethers_1.ethers.Contract(config_1.config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
            const isVerified = await registry.isVerified(userAddress);
            if (!isVerified) {
                console.log(`[AAService] User ${userAddress} not KYC verified. Auto-registering...`);
                const idHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`AUTO-${userAddress}-${Date.now()}`));
                const registerTx = await registry.register(userAddress, idHash);
                await registerTx.wait();
                console.log(`[AAService] KYC registered: ${registerTx.hash}`);
            }
            // 2. Prepare Investment via Gateway
            // Gateway ABI
            const GATEWAY_ABI = [
                "function investWithPermit(address user, uint256 amount, address treasury, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
            ];
            const gateway = new ethers_1.ethers.Contract(gatewayAddress, GATEWAY_ABI, adminWallet);
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals
            // Generate Dummy Permit (Since MockUSDT is in Demo Mode)
            // In production, these params would come from the frontend user's signature.
            // For now, we simulate a valid permit because MockUSDT.permit() accepts anything in testnet.
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const dummyV = 27;
            const dummyR = ethers_1.ethers.ZeroHash;
            const dummyS = ethers_1.ethers.ZeroHash;
            console.log(`[AAService] Calling Gateway for ${userAddress} amount ${amountBig}...`);
            try {
                // This call will fail if the User has not Approved the Gateway OR if MockUSDT.permit is not working.
                // Since user hasn't signed a real permit, we rely on MockUSDT.permit to treat dummy sig as an Approval.
                const investTx = await gateway.investWithPermit(userAddress, amountBig, treasuryAddress, deadline, dummyV, dummyR, dummyS);
                const receipt = await investTx.wait();
                console.log(`[AAService] Investment confirmed: ${investTx.hash}`);
                return {
                    success: true,
                    txHash: investTx.hash,
                    message: `Invested ${amount} USDT in ${bondId} (gasless)`
                };
            }
            catch (error) {
                console.error(`[AAService] Gateway invest failed:`, error.message);
                // Check for common errors
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
    async mintUSDT(to, amount) {
        return this.withLock(async () => {
            if (!config_1.config.admin.privateKey) {
                throw new Error("Admin key required for faucet");
            }
            const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider);
            const usdt = new ethers_1.ethers.Contract(config_1.config.contracts.usdtAddress, USDT_ABI, adminWallet);
            const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals
            const tx = await usdt.mint(to, amountBig);
            await tx.wait();
            return tx.hash;
        });
    }
    /**
     * Backend-Sponsored Redemption (Gasless)
     */
    async redeem(userAddress, bondAmount, bondId = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config_1.config.admin.privateKey)
                throw new Error('Admin key not configured');
            // Resolve Bond
            const bondData = this.bondService.getBondByIdSync(bondId);
            if (!bondData)
                throw new Error(`Bond not found: ${bondId}`);
            if (!bondData.treasuryAddress)
                throw new Error(`Treasury not configured for: ${bondId}`);
            const treasuryAddress = bondData.treasuryAddress;
            console.log(`[AAService] Processing gasless redemption for ${userAddress}: ${bondAmount} GBOND`);
            const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider);
            const TREASURY_REDEEM_ABI = [
                "function adminRedeem(address user, uint256 bondAmount) external"
            ];
            const treasury = new ethers_1.ethers.Contract(treasuryAddress, TREASURY_REDEEM_ABI, adminWallet);
            const amountBig = ethers_1.ethers.parseUnits(bondAmount, 18); // GBOND has 18 decimals
            try {
                const tx = await treasury.adminRedeem(userAddress, amountBig);
                console.log(`[AAService] Redemption TX sent: ${tx.hash}`);
                await tx.wait();
                console.log(`[AAService] Redemption confirmed`);
                return {
                    success: true,
                    txHash: tx.hash,
                    message: `Redeemed ${bondAmount} GBOND (gasless)`
                };
            }
            catch (error) {
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
    async claim(userAddress, bondId = 'GOI-2030') {
        return this.withLock(async () => {
            if (!config_1.config.admin.privateKey)
                throw new Error('Admin key not configured');
            // Resolve Bond
            const bondData = this.bondService.getBondByIdSync(bondId);
            if (!bondData)
                throw new Error(`Bond not found: ${bondId}`);
            // Note: Bond Registry has "distributorAddress" but we might need to fetch it from the bond data structure in bondService
            // The JSON structure has it.
            const distributorAddress = bondData.distributorAddress || config_1.config.contracts.distributorAddress; // Fallback
            if (!distributorAddress)
                throw new Error(`Distributor not configured`);
            console.log(`[AAService] Processing gasless claim for ${userAddress}`);
            const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider);
            const DISTRIBUTOR_CLAIM_ABI = [
                "function adminClaim(address beneficiary) external"
            ];
            const distributor = new ethers_1.ethers.Contract(distributorAddress, DISTRIBUTOR_CLAIM_ABI, adminWallet);
            try {
                const tx = await distributor.adminClaim(userAddress);
                console.log(`[AAService] Claim TX sent: ${tx.hash}`);
                await tx.wait();
                console.log(`[AAService] Claim confirmed`);
                return {
                    success: true,
                    txHash: tx.hash,
                    message: `Yield claimed successfully (gasless)`
                };
            }
            catch (error) {
                console.error(`[AAService] adminClaim failed:`, error.message);
                if (error.message?.includes('Nothing to claim')) {
                    throw new Error('No yield available to claim.');
                }
                throw error;
            }
        });
    }
}
exports.AAService = AAService;
AAService.mutex = Promise.resolve();
