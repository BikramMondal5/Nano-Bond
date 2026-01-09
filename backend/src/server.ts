import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { config } from './config';
import { BondService } from './services/bond.service';
import { AAService } from './services/aa.service';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Services
const bondService = new BondService();
const aaService = new AAService();

// Provider and Wallet for admin operations
const provider = new ethers.JsonRpcProvider(config.rpc.url);
const adminWallet = config.admin.privateKey
    ? new ethers.Wallet(config.admin.privateKey, provider)
    : null;

// Identity Registry ABI
const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
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

        const portfolio = await bondService.getPortfolio(address);
        res.json(portfolio);
    } catch (error: any) {
        console.error('[API] Error fetching portfolio:', error.message);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
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
        console.log('[API] GET /api/debt/status');
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
 * Register a user's wallet for KYC verification
 */
app.post('/api/kyc/register', async (req: Request, res: Response) => {
    try {
        const { address, nationalId } = req.body;
        console.log(`[API] POST /api/kyc/register - address: ${address}`);

        if (!address) {
            res.status(400).json({ error: 'Missing address' });
            return;
        }

        if (!adminWallet) {
            console.error('[API] Admin wallet not configured');
            res.status(500).json({ error: 'KYC service not configured' });
            return;
        }

        // Create nationalIdHash
        const idToHash = nationalId || `AUTO-${address}-${Date.now()}`;
        const nationalIdHash = ethers.keccak256(ethers.toUtf8Bytes(idToHash));

        // Connect to IdentityRegistry
        const registry = new ethers.Contract(
            config.contracts.registryAddress,
            IDENTITY_REGISTRY_ABI,
            adminWallet
        );

        // Check if already verified
        const isAlreadyVerified = await registry.isVerified(address);
        if (isAlreadyVerified) {
            console.log(`[API] Address ${address} is already verified`);
            res.json({
                success: true,
                message: 'Already verified',
                txHash: null
            });
            return;
        }

        // Register the user
        console.log(`[API] Registering ${address} with hash ${nationalIdHash}`);
        const tx = await registry.register(address, nationalIdHash);
        console.log(`[API] TX sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[API] TX confirmed in block ${receipt.blockNumber}`);

        res.json({
            success: true,
            message: 'KYC registration successful',
            txHash: tx.hash,
        });

    } catch (error: any) {
        console.error('[API] KYC registration error:', error.message);

        if (error.message?.includes('Already registered')) {
            res.json({
                success: true,
                message: 'Already registered',
                txHash: null
            });
            return;
        }

        res.status(500).json({ error: 'KYC registration failed: ' + error.message });
    }
});

/**
 * GET /api/kyc/status/:address
 * Check if an address is KYC verified
 */
app.get('/api/kyc/status/:address', async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        console.log(`[API] GET /api/kyc/status/${address}`);

        const registry = new ethers.Contract(
            config.contracts.registryAddress,
            IDENTITY_REGISTRY_ABI,
            provider
        );

        const isVerified = await registry.isVerified(address);

        res.json({ address, isVerified });
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

        console.log(`[API] Processing investment for ${address}: ${amount} USDT in ${bondId || 'Default'}`);

        const result = await aaService.invest(address, amount, bondId);
        res.json(result);
    } catch (error: any) {
        console.error('[API] Invest error:', error.message);
        res.status(500).json({ error: 'Investment failed: ' + error.message });
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
        const { amount } = req.body;
        const yieldAmount = parseFloat(amount) || 10;

        console.log(`[API] POST /api/admin/distribute-yield - amount: ${yieldAmount}`);

        if (!adminWallet) {
            res.status(500).json({ error: 'Admin wallet not configured' });
            return;
        }

        const distributor = new ethers.Contract(config.contracts.distributorAddress, DISTRIBUTOR_ABI, adminWallet);
        const usdt = new ethers.Contract(config.contracts.usdtAddress, ERC20_ABI, adminWallet);

        const yieldBig = ethers.parseUnits(yieldAmount.toString(), 6);

        // Approve
        console.log('[API] Approving USDT...');
        const approveTx = await usdt.approve(config.contracts.distributorAddress, yieldBig);
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
    
    RPC: ${config.rpc.url}
    Admin Wallet: ${adminWallet ? adminWallet.address : 'NOT CONFIGURED'}
    =============================================
    `);
});
