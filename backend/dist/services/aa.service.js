"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AAService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const bond_service_1 = require("./bond.service");
const Investment_1 = require("../models/Investment");
const User_1 = require("../models/User");
const KYCSubmission_1 = require("../models/KYCSubmission");
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
    "function adminBurn(address from, uint256 amount) external",
];
const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
];
class AAService {
    /**
     * Executes an action within the global mutex lock.
     * Use this ONLY for operations that must be sequential (like nonce assignment).
     * Do NOT await long-running tasks (like confirmation) inside here.
     */
    async withLock(action) {
        const result = AAService.mutex.then(() => action());
        // Catch errors so the chain continues
        AAService.mutex = result.then(() => { }).catch(() => { });
        return result;
    }
    /**
     * Helper to submit a transaction safely with proper nonce management.
     * Locks ONLY the submission part.
     */
    async submitTx(action) {
        return this.withLock(async () => {
            // Accessing nonce logic inside here ensures sequence
            return action();
        });
    }
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
        this.bondService = new bond_service_1.BondService();
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
    async invest(userAddress, amount, bondId = 'GOI-2030', network = 'mantle', requestId, timestamp, signature) {
        // 0. Verify Signature (Security)
        if (!signature || !timestamp || !requestId) {
            console.warn('[AAService] Missing signature/timestamp/requestId. Allowing for legacy dev, but UNSAFE.');
        }
        else {
            const payload = `INVEST:${userAddress}:${amount}:${bondId}:${requestId}:${timestamp}`;
            const signer = ethers_1.ethers.verifyMessage(payload, signature);
            if (signer.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error("Invalid signature. You are not authorized.");
            }
            if (Date.now() - timestamp > 5 * 60 * 1000) {
                throw new Error("Request expired");
            }
        }
        if (!config_1.config.admin.privateKey) {
            throw new Error('Admin private key not configured');
        }
        console.log(`[AAService] Processing investment for ${userAddress}: ${amount} USDT in ${bondId} on ${network}`);
        // Network-specific configuration
        const NETWORK_CONFIG = {
            mantle: {
                rpc: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
                registry: config_1.config.contracts.registryAddress,
                usdt: process.env.USDT_ADDRESS || '0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1'
            },
            polygon: {
                rpc: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
                registry: process.env.POLYGON_IDENTITY_REGISTRY || config_1.config.contracts.registryAddress,
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
        const networkProvider = new ethers_1.ethers.JsonRpcProvider(networkConfig.rpc);
        const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, networkProvider);
        // Resolve Bond
        const bondData = await this.bondService.getBondByIdSync(bondId);
        if (!bondData)
            throw new Error(`Bond not found: ${bondId}`);
        if (!bondData.treasuryAddress)
            throw new Error(`Treasury not configured for: ${bondId}`);
        const treasuryAddress = bondData.treasuryAddress;
        const amountBig = BigInt(Math.round(amount * 1000000)); // 6 decimals
        // 1. Check KYC Status in MongoDB (Source of Truth)
        // Ensure strictly lower case for address matching
        const userAddressLower = userAddress.toLowerCase();
        const user = await User_1.User.findOne({ walletAddress: userAddressLower });
        const kycParams = await KYCSubmission_1.KYCSubmission.findOne({ walletAddress: userAddressLower });
        const isUserApproved = user && user.kycStatus === 'APPROVED';
        // Allow if status is APPROVED OR if kycApprovedAt date exists (handling inconsistent data)
        const isKycApproved = kycParams && (kycParams.status === 'APPROVED' || !!kycParams.kycApprovedAt);
        console.log(`[AAService] Check ${userAddress}: UserDB=${isUserApproved}, KYCDB=${isKycApproved} (Status=${kycParams?.status}, Date=${kycParams?.kycApprovedAt})`);
        if (!isUserApproved && !isKycApproved) {
            throw new Error(`User ${userAddress} is not KYC Verified in database. Please complete KYC first.`);
        }
        // 1.5 Sync KYC to On-Chain Registry (Auto-register if DB says Approved but Chain says No)
        if (networkConfig.registry && (network === 'mantle' || network === 'polygon')) {
            const registry = new ethers_1.ethers.Contract(networkConfig.registry, IDENTITY_REGISTRY_ABI, adminWallet);
            try {
                const isVerified = await registry.isVerified(userAddress);
                if (!isVerified) {
                    console.log(`[AAService] User verified in DB but not on-chain. Syncing ${userAddress} to registry...`);
                    const idHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`SYNC-${userAddress}-${Date.now()}`));
                    const registerTx = await registry.register(userAddress, idHash);
                    await registerTx.wait();
                    console.log(`[AAService] KYC synced to chain: ${registerTx.hash}`);
                }
            }
            catch (kycErr) {
                console.warn(`[AAService] Chain KYC sync error (non-blocking if DB approved):`, kycErr);
            }
        }
        // 1.5 Check Idempotency
        if (requestId) {
            const existing = await Investment_1.Investment.findOne({ requestId });
            if (existing && existing.status === 'SUCCESS') {
                return {
                    success: true,
                    txHash: existing.txHash,
                    message: 'Transaction already processed',
                    newBalance: 0
                };
            }
            if (existing && existing.status === 'PENDING') {
                throw new Error("Transaction currently processing");
            }
        }
        try {
            // 2. BURN FUNDS ON SOURCE NETWORK
            console.log(`[AAService] Deducting funds from user on ${network}...`);
            const usdt = new ethers_1.ethers.Contract(networkConfig.usdt, USDT_ABI, adminWallet);
            // Check balance first
            const userBalance = await usdt.balanceOf(userAddress);
            if (userBalance < amountBig) {
                throw new Error(`Insufficient USDT balance. Required: ${amount}, Available: ${Number(userBalance) / 1000000}`);
            }
            // Use extended MockUSDT burn (admin burns from user)
            const burnTx = await usdt.burn(userAddress, amountBig);
            await burnTx.wait();
            console.log(`[AAService] Burned ${amount} USDT from user on ${network}: ${burnTx.hash}`);
            // 3. MINT TO ADMIN ON MANTLE (Liquidity movement simulation)
            const mantleProvider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz');
            const mantleAdminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, mantleProvider);
            const mantleUsdtAddress = process.env.USDT_ADDRESS || '0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1';
            const mantleUsdt = new ethers_1.ethers.Contract(mantleUsdtAddress, USDT_ABI, mantleAdminWallet);
            const mantleMintTx = await mantleUsdt.mint(mantleAdminWallet.address, amountBig);
            await mantleMintTx.wait();
            console.log(`[AAService] Minted ${amount} USDT to admin wallet on Mantle`);
            // 4. APPROVE TREASURY ON MANTLE
            const approveTx = await mantleUsdt.approve(treasuryAddress, amountBig);
            await approveTx.wait();
            console.log(`[AAService] Approved Treasury ${treasuryAddress} to spend USDT on Mantle`);
            // 5. BUY BOND ON MANTLE
            const treasury = new ethers_1.ethers.Contract(treasuryAddress, TREASURY_SWAP_ABI, mantleAdminWallet);
            const investTx = await treasury.buyFor(amountBig, userAddress);
            // 5.5 Save PENDING State
            let investmentRecord = null;
            try {
                investmentRecord = await Investment_1.Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'INVEST',
                    amount: amount,
                    txHash: investTx.hash,
                    status: 'PENDING',
                    network: network,
                    requestId: requestId || undefined
                });
                console.log(`[AAService] Investment recorded as PENDING: ${investTx.hash}`);
            }
            catch (dbErr) {
                console.error(`[AAService] Failed to save PENDING investment:`, dbErr);
            }
            await investTx.wait();
            console.log(`[AAService] Investment confirmed on Mantle: ${investTx.hash}`);
            // 6. Update DB to SUCCESS
            if (investmentRecord) {
                investmentRecord.status = 'SUCCESS';
                await investmentRecord.save();
            }
            else {
                await Investment_1.Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'INVEST',
                    amount: amount,
                    txHash: investTx.hash,
                    status: 'SUCCESS',
                    network: network,
                    requestId: requestId || undefined
                });
            }
            // 7. Return new balance
            const remaining = BigInt(userBalance) - amountBig;
            const newBalance = Number(remaining) / 1000000;
            return {
                success: true,
                txHash: investTx.hash,
                message: `Invested ${amount} USDT in ${bondId} on ${network} (gasless)`,
                newBalance: newBalance
            };
        }
        catch (error) {
            console.error(`[AAService] Investment failed:`, error.message);
            // Update pending records to FAILED
            if (requestId) {
                const pending = await Investment_1.Investment.findOne({ requestId, status: 'PENDING' });
                if (pending) {
                    pending.status = 'FAILED';
                    await pending.save();
                }
            }
            if (error.message?.includes('Insufficient USDT')) {
                throw error;
            }
            if (error.message?.includes('balance')) {
                throw new Error(`Insufficient USDT balance on ${network}.`);
            }
            if (error.message?.includes('ExceedsBackedLogic')) {
                throw new Error('Investment exceeds available bond backing.');
            }
            throw new Error(`Failed to process investment on ${network}: ${error.message}`);
        }
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
        if (!config_1.config.admin.privateKey)
            throw new Error('Admin key not configured');
        // Resolve Bond - Unlocked
        const bondData = await this.bondService.getBondByIdSync(bondId);
        if (!bondData)
            throw new Error(`Bond not found: ${bondId}`);
        if (!bondData.treasuryAddress)
            throw new Error(`Treasury not configured for: ${bondId}`);
        const treasuryAddress = bondData.treasuryAddress;
        console.log(`[AAService] Processing gasless redemption for ${userAddress}: ${bondAmount} GBOND in ${bondId}`);
        const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider);
        // Check KYC - Unlocked
        const registry = new ethers_1.ethers.Contract(config_1.config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        const isVerified = await registry.isVerified(userAddress);
        if (!isVerified) {
            throw new Error(`User ${userAddress} is not KYC verified. Cannot redeem.`);
        }
        const TREASURY_REDEEM_ABI = [
            "function adminRedeem(address user, uint256 bondAmount) external"
        ];
        const treasury = new ethers_1.ethers.Contract(treasuryAddress, TREASURY_REDEEM_ABI, adminWallet);
        const amountBig = ethers_1.ethers.parseUnits(bondAmount, 18); // GBOND has 18 decimals
        try {
            // SUBMIT LOCKED
            const tx = await this.submitTx(() => treasury.adminRedeem(userAddress, amountBig));
            console.log(`[AAService] Redemption TX sent: ${tx.hash}`);
            // SAVE PENDING
            let record = null;
            try {
                record = await Investment_1.Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'REDEEM',
                    amount: parseFloat(bondAmount),
                    txHash: tx.hash,
                    status: 'PENDING'
                });
            }
            catch (e) {
                console.error("DB Save Pending Failed", e);
            }
            // WAIT UNLOCKED
            await tx.wait();
            console.log(`[AAService] Redemption confirmed`);
            // UPDATE SUCCESS
            if (record) {
                record.status = 'SUCCESS';
                await record.save();
            }
            else {
                await Investment_1.Investment.create({
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
        }
        catch (error) {
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
    async claim(userAddress, bondId = 'GOI-2030') {
        if (!config_1.config.admin.privateKey)
            throw new Error('Admin key not configured');
        // Resolve Bond - Unlocked
        const bondData = await this.bondService.getBondByIdSync(bondId);
        if (!bondData)
            throw new Error(`Bond not found: ${bondId}`);
        const distributorAddress = bondData.distributorAddress || config_1.config.contracts.distributorAddress; // Fallback
        if (!distributorAddress)
            throw new Error(`Distributor not configured`);
        console.log(`[AAService] Processing gasless claim for ${userAddress} in ${bondId}`);
        const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, this.provider);
        // Check KYC - Unlocked
        const registry = new ethers_1.ethers.Contract(config_1.config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, adminWallet);
        const isVerified = await registry.isVerified(userAddress);
        if (!isVerified) {
            throw new Error(`User ${userAddress} is not KYC verified. Cannot claim yield.`);
        }
        const DISTRIBUTOR_CLAIM_ABI = [
            "function adminClaim(address beneficiary) external"
        ];
        const distributor = new ethers_1.ethers.Contract(distributorAddress, DISTRIBUTOR_CLAIM_ABI, adminWallet);
        try {
            // SUBMIT LOCKED
            const tx = await this.submitTx(() => distributor.adminClaim(userAddress));
            console.log(`[AAService] Claim TX sent: ${tx.hash}`);
            // SAVE PENDING
            let record = null;
            try {
                record = await Investment_1.Investment.create({
                    walletAddress: userAddress,
                    bondId: bondId,
                    type: 'CLAIM',
                    amount: 0,
                    txHash: tx.hash,
                    status: 'PENDING'
                });
            }
            catch (e) {
                console.error("DB Pending Save Failed", e);
            }
            // WAIT UNLOCKED
            await tx.wait();
            console.log(`[AAService] Claim confirmed`);
            // UPDATE SUCCESS
            if (record) {
                record.status = 'SUCCESS';
                await record.save();
            }
            else {
                await Investment_1.Investment.create({
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
        }
        catch (error) {
            console.error(`[AAService] adminClaim failed:`, error.message);
            if (error.message?.includes('Nothing to claim')) {
                throw new Error('No yield available to claim.');
            }
            throw error;
        }
    }
}
exports.AAService = AAService;
AAService.mutex = Promise.resolve();
