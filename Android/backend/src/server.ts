import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { config } from './config';
import { BondService } from './services/bond.service';
import { AAService } from './services/aa.service';
import { DbService } from './services/db.service';
import { DeploymentService } from './services/deployment.service';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files (admin page)

import { UserService } from './services/user.service';

// Services
const bondService = new BondService();
const dbService = new DbService();
const aaService = new AAService(dbService);
const userService = new UserService();
let deploymentService: DeploymentService | null = null;

// Provider and Wallet for admin operations
const provider = new ethers.JsonRpcProvider(config.rpc.url);
const adminWallet = config.admin.privateKey
    ? new ethers.Wallet(config.admin.privateKey, provider)
    : null;

// Identity Registry ABI
const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
    "function registerVerified(address wallet, bytes32 aadhaarHash, bytes memory walletSignature, uint8 riskScore) external", // Added here for consistency
];

// MockUSDT ABI
const MOCK_USDT_ABI = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
];

// CouponDistributor ABI
const DISTRIBUTOR_ABI = [
    "function depositYield(uint256 amount) external",
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// PUBLIC CONFIG (for admin-web)
// ============================================

app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
        rpcUrl: config.rpc.url,
        contracts: config.contracts
    });
});

// ============================================
// BONDS API
// ============================================

/**
 * GET /api/bonds
 * List all registered bonds with on-chain data
 */
app.get('/api/bonds', async (_req: Request, res: Response) => {
    try {
        console.log('[API] GET /api/bonds');
        const bonds = await bondService.listBonds();
        res.json({ bonds });
    } catch (error: any) {
        console.error('[API] Error fetching bonds:', error.message);
        res.status(500).json({ error: 'Failed to fetch bonds' });
    }
});

/**
 * GET /api/bonds/:address
 * Get a specific bond by contract address
 */
app.get('/api/bonds/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        console.log(`[API] GET /api/bonds/${address}`);

        const bond = await bondService.getBondByAddress(address);

        if (!bond) {
            res.status(404).json({ error: 'Bond not found' });
            return;
        }

        res.json(bond);
    } catch (error: any) {
        console.error('[API] Error fetching bond:', error.message);
        res.status(500).json({ error: 'Failed to fetch bond info' });
    }
});

// ============================================
// PORTFOLIO API
// ============================================

/**
 * GET /api/portfolio/:address
 * Get user portfolio summary
 */
app.get('/api/portfolio/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        console.log(`[API] GET /api/portfolio/${address}`);

        const portfolio: any = await bondService.getPortfolio(address);

        // Inject pending yield
        const pendingYield = await aaService.getClaimableYield(address);
        portfolio.pendingYield = pendingYield;

        res.json(portfolio);
    } catch (error: any) {
        console.error('[API] Error fetching portfolio:', error.message);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

/**
 * GET /api/history/:address
 * Get user transaction history
 */
app.get('/api/history/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        console.log(`[API] GET /api/history/${address}`);
        const history = await dbService.getUserHistory(address);
        res.json({ history });
    } catch (error: any) {
        console.error('[API] Error fetching history:', error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// ============================================
// DEBT MONITORING API
// ============================================

/**
 * GET /api/debt/status
 * Get debt monitoring status across all bonds
 */
app.get('/api/debt/status', async (_req: Request, res: Response) => {
    try {
        const status = await bondService.getDebtStatus();
        res.json(status);
    } catch (error: any) {
        console.error('[API] Error fetching debt status:', error.message);
        res.status(500).json({ error: 'Failed to fetch debt status' });
    }
});

// ============================================
// KYC API
// ============================================

/**
 * POST /api/kyc/register
 * Secure endpoint for KYC registration.
 * Privacy Guarantee:
 * 1. Validates input.
 * 2. Hashes 'nationalId' immediately.
 * 3. Submits Hash to Blockchain.
 * 4. Stores { wallet, hash, verified: true } in MongoDB securely.
 * 5. Does NOT save raw 'nationalId' anywhere.
 */
app.post('/api/kyc/register', async (req: Request, res: Response) => {
    try {
        const { address, nationalId, nationalIdHash: preHashedId } = req.body;

        // 1. Strict Input Validation
        if (!address || (!nationalId && !preHashedId)) {
            console.log(`[KYC] Failed request - Missing Data`);
            res.status(400).json({ error: 'Missing address or nationalId/nationalIdHash' });
            return;
        }

        if (!adminWallet) {
            console.error('[KYC] Admin wallet not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        // 2. Use pre-hashed ID from device (more secure) or hash on server (fallback)
        // SECURITY: Raw ID should be hashed on device - we receive only the hash
        let nationalIdHash: string;
        if (preHashedId) {
            nationalIdHash = preHashedId;
            console.log(`[KYC] Using device-hashed ID (secure): ${nationalIdHash.substring(0, 20)}...`);
        } else {
            // Fallback: Hash on server (less secure, for backward compatibility)
            nationalIdHash = ethers.keccak256(ethers.toUtf8Bytes(nationalId));
            console.log(`[KYC] Server-side hash (fallback): ${nationalIdHash.substring(0, 20)}...`);
        }
        // NOTE: Raw nationalId is NEVER logged or stored

        console.log(`[KYC] Processing KYC for ${address}`);

        const registry = new ethers.Contract(
            config.contracts.registryAddress,
            IDENTITY_REGISTRY_ABI,
            adminWallet
        );

        // 3. Check if already verified ON-CHAIN FIRST (Critical: Don't trust DB cache after registry migration)
        const isVerifiedOnChain = await registry.isVerified(address);
        if (isVerifiedOnChain) {
            console.log(`[KYC] Address ${address} already verified on-chain.`);
            // Sync DB if needed
            const dbStatus = await userService.getUserStatus(address);
            if (!dbStatus.isVerified) {
                await userService.registerUser({
                    walletAddress: address,
                    aadhaarHash: nationalIdHash,
                    kycStatus: 'APPROVED',
                    kycApprovedAt: new Date()
                });
            }
            res.json({ success: true, message: 'Already verified' });
            return;
        }

        // NOTE: Even if DB says verified, we MUST re-register if on-chain check failed
        // This handles registry contract migrations gracefully
        const dbStatus = await userService.getUserStatus(address);
        if (dbStatus.isVerified) {
            console.log(`[KYC] Address ${address} verified in DB but NOT on-chain. Re-registering on new registry...`);
        }

        const { signature } = req.body;
        if (!signature) {
            return res.status(400).json({ error: 'Missing signature' });
        }

        console.log(`[KYC] Sending TX to blockchain (V2)...`);
        // V2: registerVerified(wallet, hash, signature, riskScore)
        const tx = await registry.registerVerified(address, nationalIdHash, signature, 0);
        console.log(`[KYC] TX Sent: ${tx.hash}`);

        // Wait for confirmation
        await tx.wait();
        console.log(`[KYC] Verification Confirmed on Blockchain.`);

        // 4. Save to MongoDB (Separate Section)
        await userService.registerUser({
            walletAddress: address,
            aadhaarHash: nationalIdHash,
            kycStatus: 'APPROVED',
            kycApprovedAt: new Date(),
            txHash: tx.hash
        });

        // 5. Success Response
        res.json({
            success: true,
            message: 'Secure Verification Successful',
            txHash: tx.hash
        });

    } catch (error: any) {
        console.error('[KYC] Error:', error.message);
        res.status(500).json({ error: 'Verification failed' });
    }
});

/**
 * GET /api/kyc/status/:address
 * Check if an address is KYC verified
 * Optimized: Checks MongoDB first.
 */
app.get('/api/kyc/status/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        // console.log(`[API] GET /api/kyc/status/${address}`); // Reduce logs

        // 1. Check MongoDB (Fastest)
        const dbStatus = await userService.getUserStatus(address);
        if (dbStatus.isVerified) {
            res.json({ address, isVerified: true, source: 'db' });
            return;
        }

        // 2. Fallback to Blockchain (If DB is out of sync or empty)
        const registry = new ethers.Contract(
            config.contracts.registryAddress,
            IDENTITY_REGISTRY_ABI,
            provider
        );

        const isVerifiedOnChain = await registry.isVerified(address);

        // If verified on chain but not in DB, assume we should treat them as verified.
        // We can't backfill the nationalIdHash here since we don't have it, but we can mark them as verified.
        if (isVerifiedOnChain) {
            // Optional: Update DB to avoid future chain calls (partial record)
            await userService.registerUser({
                walletAddress: address,
                aadhaarHash: 'UNKNOWN_ONCHAIN_SYNC',
                kycStatus: 'APPROVED',
                kycApprovedAt: new Date()
            });
        }

        res.json({ address, isVerified: isVerifiedOnChain, source: 'chain' });
    } catch (error: any) {
        console.error('[API] KYC status error:', error.message);
        res.status(500).json({ error: 'Failed to check KYC status' });
    }
});

// ============================================
// GASLESS INVEST API (Account Abstraction)
// ============================================

/**
 * POST /api/invest
 * Invest in bonds without gas (Backend sponsors tx)
 */
app.post('/api/invest', async (req: Request, res: Response) => {
    try {
        const { address, amount, bondId } = req.body;

        if (!address || !amount) {
            return res.status(400).json({ error: 'Missing address or amount' });
        }

        // SECURITY CHECK: Verify KYC Status before allowing Investment
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, provider);
        const isVerified = await registry.isVerified(address);

        if (!isVerified) {
            console.warn(`[API] Blocked unverified investment attempt from ${address}`);
            return res.status(403).json({ error: 'KYC Verification Required. Please verify your identity first.' });
        }

        console.log(`[API] Processing investment for ${address}: ${amount} USDT in ${bondId || 'Default'}`);

        const result = await aaService.invest(address, amount, bondId);
        res.json(result);
    } catch (error: any) {
        console.error('[API] Invest error:', error.message);
        res.status(500).json({ error: 'Investment failed: ' + error.message });
    }
});

/**
 * POST /api/redeem
 * Redeem bonds without gas
 */
app.post('/api/redeem', async (req: Request, res: Response) => {
    try {
        const { address, amount, bondId } = req.body; // amount is string (GBOND)

        if (!address || !amount) {
            return res.status(400).json({ error: 'Missing address or amount' });
        }

        // SECURITY CHECK: Verify KYC Status
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, provider);
        if (!(await registry.isVerified(address))) {
            return res.status(403).json({ error: 'KYC Verification Required' });
        }

        console.log(`[API] Processing redemption for ${address}: ${amount} GBOND`);

        const result = await aaService.redeem(address, amount.toString(), bondId);
        res.json(result);
    } catch (error: any) {
        console.error('[API] Redeem error:', error.message);
        res.status(500).json({ error: 'Redemption failed: ' + error.message });
    }
});

/**
 * POST /api/claim
 * Claim yield without gas
 */
app.post('/api/claim', async (req: Request, res: Response) => {
    try {
        const { address, bondId } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Missing address' });
        }

        // SECURITY CHECK: Verify KYC Status
        const registry = new ethers.Contract(config.contracts.registryAddress, IDENTITY_REGISTRY_ABI, provider);
        if (!(await registry.isVerified(address))) {
            return res.status(403).json({ error: 'KYC Verification Required' });
        }

        console.log(`[API] Processing claim for ${address}`);

        const result = await aaService.claim(address, bondId);
        res.json(result);
    } catch (error: any) {
        console.error('[API] Claim error:', error.message);
        res.status(500).json({ error: 'Claim failed: ' + error.message });
    }
});

// ============================================
// USDT FAUCET API (For Testing)
// ============================================

/**
 * POST /api/faucet/usdt
 * Mint MockUSDT to a user's wallet (for testing)
 */
app.post('/api/faucet/usdt', async (req: Request, res: Response) => {
    try {
        const { address, amount } = req.body;
        const mintAmount = parseFloat(amount) || 1000;

        console.log(`[API] POST /api/faucet/usdt - address: ${address}, amount: ${mintAmount}`);

        if (!address) {
            res.status(400).json({ error: 'Missing address' });
            return;
        }

        if (!adminWallet) {
            console.error('[API] Admin wallet not configured');
            res.status(500).json({ error: 'Faucet not configured' });
            return;
        }

        // Connect to MockUSDT
        const usdt = new ethers.Contract(
            config.contracts.usdtAddress,
            MOCK_USDT_ABI,
            adminWallet
        );

        // Mint USDT (6 decimals)
        const amountWithDecimals = BigInt(Math.round(mintAmount * 1000000));

        const tx = await usdt.mint(address, amountWithDecimals);
        console.log(`[API] Faucet TX sent: ${tx.hash}`);
        await tx.wait();
        console.log(`[API] Faucet TX confirmed`);

        // Record usage
        await dbService.recordTransaction({
            txHash: tx.hash,
            userAddress: address,
            type: 'FAUCET',
            amount: mintAmount,
            currency: 'USDT',
            status: 'SUCCESS'
        });

        res.json({
            success: true,
            message: `Minted ${mintAmount} USDT to ${address}`,
            txHash: tx.hash
        });

    } catch (error: any) {
        console.error('[API] USDT faucet error:', error.message);
        res.status(500).json({ error: 'Failed to mint USDT: ' + error.message });
    }
});

/**
 * GET /api/faucet/balance/:address
 * Check USDT balance
 */
app.get('/api/faucet/balance/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        console.log(`[API] GET /api/faucet/balance/${address}`);

        const usdt = new ethers.Contract(
            config.contracts.usdtAddress,
            MOCK_USDT_ABI,
            provider
        );

        const balance = await usdt.balanceOf(address);
        const balanceFormatted = Number(balance) / 1000000;

        res.json({ address, balance: balanceFormatted, unit: 'USDT' });
    } catch (error: any) {
        console.error('[API] Balance check error:', error.message);
        res.status(500).json({ error: 'Failed to check balance' });
    }
});

// ============================================
// YIELD DISTRIBUTION API (Admin)
// ============================================

/**
 * POST /api/admin/distribute-yield
 * Distribute yield to bond holders
 */
app.post('/api/admin/distribute-yield', async (req: Request, res: Response) => {
    try {
        const { amount, bondId } = req.body;
        const targetBondId = bondId || 'GOI-2030';
        const yieldAmount = parseFloat(amount) || 10;

        console.log(`[API] POST /api/admin/distribute-yield - amount: ${yieldAmount}, bondId: ${targetBondId}`);

        if (!adminWallet) {
            res.status(500).json({ error: 'Admin wallet not configured' });
            return;
        }

        // Fetch Bond to get distributor address from MongoDB
        const bond: any = await bondService.getBondById(targetBondId);
        if (!bond) {
            res.status(404).json({ error: `Bond not found: ${targetBondId}` });
            return;
        }
        if (!bond.distributorAddress) {
            res.status(400).json({ error: `Distributor not configured for bond ${targetBondId}` });
            return;
        }

        const distributorAddress = bond.distributorAddress;
        console.log(`[API] Using distributor ${distributorAddress} for bond ${targetBondId}`);

        const distributor = new ethers.Contract(distributorAddress, DISTRIBUTOR_ABI, adminWallet);
        const usdt = new ethers.Contract(config.contracts.usdtAddress, ERC20_ABI, adminWallet);

        const yieldBig = ethers.parseUnits(yieldAmount.toString(), 6);

        // Approve
        console.log(`[API] Approving USDT for ${distributorAddress}...`);
        const approveTx = await usdt.approve(distributorAddress, yieldBig);
        await approveTx.wait();

        // Deposit Yield
        console.log('[API] Calling depositYield...');
        const tx = await distributor.depositYield(yieldBig);
        await tx.wait();

        res.json({
            success: true,
            message: `Distributed ${yieldAmount} USDT yield`,
            txHash: tx.hash
        });

    } catch (error: any) {
        console.error('[API] Yield distribution error:', error.message);
        res.status(500).json({ error: 'Failed to distribute yield: ' + error.message });
    }
});

/**
 * POST /api/admin/bonds
 * Add a new bond to the registry
 */
app.post('/api/admin/bonds', async (req: Request, res: Response) => {
    try {
        const bondData = req.body;
        console.log(`[API] POST /api/admin/bonds - ${bondData.bondId}`);

        // Basic validation
        if (!bondData.bondId || !bondData.bondName) {
            res.status(400).json({ error: 'Missing required fields (bondId, bondName)' });
            return;
        }

        if (!bondData.autoDeploy && !bondData.contractAddress) {
            res.status(400).json({ error: 'contractAddress is required when autoDeploy is false' });
            return;
        }

        // Ensure numeric fields are numbers
        if (bondData.couponRate) bondData.couponRate = Number(bondData.couponRate);
        if (bondData.minInvestment) bondData.minInvestment = Number(bondData.minInvestment);
        if (bondData.maxSubscription) bondData.maxSubscription = Number(bondData.maxSubscription);

        // Optional: Auto-deploy contracts (Bond + Treasury + Distributor)
        if (bondData.autoDeploy) {
            const ownerWallet = bondData.adminWallet;
            if (!ownerWallet) {
                res.status(400).json({ error: 'adminWallet is required for autoDeploy' });
                return;
            }

            if (!deploymentService) {
                deploymentService = new DeploymentService();
            }

            const deployment = await deploymentService.deployBondProduct({
                bondName: bondData.bondName,
                bondId: bondData.bondId,
                ownerWallet
            });

            bondData.contractAddress = deployment.contractAddress;
            bondData.treasuryAddress = deployment.treasuryAddress;
            bondData.distributorAddress = deployment.distributorAddress;
        }

        const newBond = await bondService.addBond(bondData);
        res.json({ success: true, bond: newBond });

    } catch (error: any) {
        console.error('[API] Add bond error:', error.message);
        res.status(500).json({ error: 'Failed to add bond: ' + error.message });
    }
});

// ============================================
// START SERVER
// ============================================

export default app;

app.listen(PORT, () => {
    console.log(`
    =============================================
       SOVEREIGN BOND UNIFIED API SERVER
    =============================================
    
    Server running on: http://localhost:${PORT}
    
    Endpoints:
      GET  /health               - Health check
      GET  /api/config           - Public config (RPC + contract addresses)
      GET  /api/bonds            - List all bonds
      GET  /api/bonds/:address   - Get bond by address
      GET  /api/portfolio/:addr  - Get user portfolio
      GET  /api/debt/status      - Debt monitoring status
      POST /api/kyc/register     - Register for KYC
      GET  /api/kyc/status/:addr - Check KYC status
      POST /api/invest           - Gasless Investment (AA)
      POST /api/faucet/usdt      - Mint test USDT
      GET  /api/faucet/balance/:addr - Check USDT balance
      POST /api/admin/distribute-yield - Distribute yield
      POST /api/admin/bonds      - Add bond to registry (supports autoDeploy)
    
    RPC: ${config.rpc.url}
    Admin Wallet: ${adminWallet ? adminWallet.address : 'NOT CONFIGURED'}
    =============================================
    `);
});
