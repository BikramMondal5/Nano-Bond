import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { config } from './config';
import { BondService } from './services/bond.service';
import { AAService } from './services/aa.service';

const app = express();
const PORT = process.env.PORT || 3001;

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
        const { address, amount, bondId, network = 'mantle' } = req.body;

        if (!address || !amount) {
            return res.status(400).json({ error: 'Missing address or amount' });
        }

        console.log(`[API] Processing investment for ${address}: ${amount} USDT in ${bondId || 'Default'} from ${network}`);

        // For all supported networks: Direct investment using AAService
        const SUPPORTED_NETWORKS = ['mantle', 'polygon', 'ethereum', 'arbitrum', 'linea', 'scroll'];
        if (SUPPORTED_NETWORKS.includes(network)) {
            const result = await aaService.invest(address, amount, bondId, network);
            return res.json(result);
        }

        // For other networks: Cross-chain investment via LayerZero
        if (!config.admin.privateKey) {
            return res.status(500).json({ error: 'Admin wallet not configured' });
        }

        const NETWORK_CONFIGS: Record<string, { rpc: string; usdtAddress: string; gatewayAddress: string }> = {
            ethereum: {
                rpc: process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org',
                usdtAddress: process.env.USDT_ETHEREUM || '',
                gatewayAddress: process.env.CROSS_CHAIN_GATEWAY_ETHEREUM || ''
            },
            arbitrum: {
                rpc: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
                usdtAddress: process.env.USDT_ARBITRUM || '',
                gatewayAddress: process.env.CROSS_CHAIN_GATEWAY_ARBITRUM || ''
            },
            linea: {
                rpc: process.env.LINEA_RPC_URL || 'https://rpc.sepolia.linea.build',
                usdtAddress: process.env.USDT_LINEA || '',
                gatewayAddress: process.env.CROSS_CHAIN_GATEWAY_LINEA || ''
            },
            polygon: {
                rpc: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
                usdtAddress: process.env.USDT_POLYGON || '',
                gatewayAddress: process.env.CROSS_CHAIN_GATEWAY_POLYGON || ''
            },
            scroll: {
                rpc: process.env.SCROLL_RPC_URL || 'https://sepolia-rpc.scroll.io',
                usdtAddress: process.env.USDT_SCROLL || '',
                gatewayAddress: process.env.CROSS_CHAIN_GATEWAY_SCROLL || ''
            }
        };

        const networkConfig = NETWORK_CONFIGS[network];
        if (!networkConfig) {
            return res.status(400).json({ error: `Unsupported network: ${network}` });
        }

        if (!networkConfig.gatewayAddress) {
            return res.status(400).json({ error: `Gateway not configured for network: ${network}` });
        }

        // Create provider and wallet for the source network
        const networkProvider = new ethers.JsonRpcProvider(networkConfig.rpc);
        const networkAdminWallet = new ethers.Wallet(config.admin.privateKey, networkProvider);

        const CROSS_CHAIN_GATEWAY_ABI = [
            "function investCrossChain(uint256 amount, uint32 dstEid, bytes calldata extraOptions) external payable returns (bytes32)",
            "function investCrossChainFor(address beneficiary, uint256 amount, uint32 dstEid, bytes calldata extraOptions) external payable returns (bytes32)",
            "function quoteCrossChainFee(uint32 dstEid, uint256 amount, bytes calldata extraOptions) external view returns (uint256, uint256)"
        ];

        const USDT_ABI = [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
            "function mint(address to, uint256 amount) external"
        ];

        const gateway = new ethers.Contract(networkConfig.gatewayAddress, CROSS_CHAIN_GATEWAY_ABI, networkAdminWallet);
        const usdt = new ethers.Contract(networkConfig.usdtAddress, USDT_ABI, networkAdminWallet);

        const amountBig = ethers.parseUnits(amount.toString(), 6);
        const dstEid = 40356; // Mantle Sepolia LayerZero endpoint ID

        // 1. Mint USDT to admin wallet (for gasless cross-chain investment)
        console.log('[API] Minting USDT to admin wallet for cross-chain investment...');
        const mintTx = await usdt.mint(networkAdminWallet.address, amountBig);
        await mintTx.wait();
        console.log('[API] USDT minted to admin wallet');

        // 2. Approve gateway to spend USDT
        console.log('[API] Approving gateway...');
        const approveTx = await usdt.approve(networkConfig.gatewayAddress, amountBig);
        await approveTx.wait();
        console.log('[API] Gateway approval confirmed');

        // 3. Quote LayerZero fee
        const [nativeFee] = await gateway.quoteCrossChainFee(dstEid, amountBig, "0x");
        console.log(`[API] LayerZero fee: ${ethers.formatEther(nativeFee)} native token`);

        // 4. Execute cross-chain investment for the user (beneficiary)
        console.log(`[API] Executing cross-chain investment for beneficiary: ${address}...`);
        const tx = await gateway.investCrossChainFor(address, amountBig, dstEid, "0x", { value: nativeFee });
        await tx.wait();

        console.log(`[API] Cross-chain investment TX: ${tx.hash}`);

        // Save to MongoDB
        const { Investment } = require('./models/Investment');
        await Investment.create({
            walletAddress: address,
            bondId: bondId || 'GOI-2030',
            type: 'INVEST_CROSS_CHAIN',
            amount: parseFloat(amount),
            txHash: tx.hash,
            status: 'PENDING',
            network,
            sourceNetwork: network,
            destinationNetwork: 'mantle'
        });

        res.json({
            success: true,
            txHash: tx.hash,
            message: `Cross-chain investment initiated from ${network}. Bonds will arrive on Mantle in ~5-10 minutes.`,
            network,
            isCrossChain: true
        });

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
 * Mint MockUSDT to a user's wallet (for testing) on a specific network
 */
app.post('/api/faucet/usdt', async (req: Request, res: Response) => {
    try {
        const { address, amount, network = 'mantle' } = req.body;
        const mintAmount = parseFloat(amount) || 1000;

        console.log(`[API] POST /api/faucet/usdt - address: ${address}, amount: ${mintAmount}, network: ${network}`);

        if (!address) {
            res.status(400).json({ error: 'Missing address' });
            return;
        }

        if (!config.admin.privateKey) {
            console.error('[API] Admin wallet not configured');
            res.status(500).json({ error: 'Faucet not configured' });
            return;
        }

        // Network configurations
        const NETWORK_CONFIGS: Record<string, { rpc: string; usdtAddress: string }> = {
            mantle: {
                rpc: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
                usdtAddress: config.contracts.usdtAddress
            },
            ethereum: {
                rpc: process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org',
                usdtAddress: process.env.USDT_ETHEREUM || ''
            },
            arbitrum: {
                rpc: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
                usdtAddress: process.env.USDT_ARBITRUM || ''
            },
            linea: {
                rpc: process.env.LINEA_RPC_URL || 'https://rpc.sepolia.linea.build',
                usdtAddress: process.env.USDT_LINEA || ''
            },
            polygon: {
                rpc: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
                usdtAddress: process.env.USDT_POLYGON || ''
            },
            scroll: {
                rpc: process.env.SCROLL_RPC_URL || 'https://sepolia-rpc.scroll.io',
                usdtAddress: process.env.USDT_SCROLL || ''
            }
        };

        const networkConfig = NETWORK_CONFIGS[network];
        if (!networkConfig) {
            return res.status(400).json({ error: `Unsupported network: ${network}` });
        }

        if (!networkConfig.usdtAddress) {
            return res.status(400).json({ error: `USDT address not configured for network: ${network}` });
        }

        // Create provider and wallet for the specific network
        const networkProvider = new ethers.JsonRpcProvider(networkConfig.rpc);
        const networkAdminWallet = new ethers.Wallet(config.admin.privateKey, networkProvider);

        // Connect to MockUSDT on the selected network
        const usdt = new ethers.Contract(
            networkConfig.usdtAddress,
            MOCK_USDT_ABI,
            networkAdminWallet
        );

        // Mint USDT (6 decimals)
        const amountWithDecimals = BigInt(Math.round(mintAmount * 1000000));

        // Add gas overrides for Linea
        let overrides = {};
        if (network === 'linea') {
            const feeData = await networkProvider.getFeeData();
            if (feeData.gasPrice) {
                // Bump gas price by 50% for Linea
                overrides = { gasPrice: (feeData.gasPrice * 150n) / 100n };
            }
        }

        const tx = await usdt.mint(address, amountWithDecimals, overrides);
        console.log(`[API] Faucet TX sent on ${network}: ${tx.hash}`);
        await tx.wait();
        console.log(`[API] Faucet TX confirmed on ${network}`);

        res.json({
            success: true,
            message: `Minted ${mintAmount} USDT to ${address} on ${network}`,
            txHash: tx.hash,
            network
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

/**
 * POST /api/admin/create-bond
 * Create a new managed bond (Deploy + Link + Grant Role)
 */
app.post('/api/admin/create-bond', async (req: Request, res: Response) => {
    try {
        const { bondId, bondName, couponRate, maxSubscription, adminWallet, minInvestment, maturityDateStr, description, issuer } = req.body;

        console.log(`[API] POST /api/admin/create-bond - ${bondId} for ${adminWallet}`);

        if (!adminWallet) {
            res.status(400).json({ error: 'Missing adminWallet address' });
            return;
        }

        if (!bondId || !bondName) {
            res.status(400).json({ error: 'Missing bondId or bondName' });
            return;
        }

        // Parse dates
        // Maturity Date is required. Start Date is roughly now.
        const startDate = new Date();
        const maturityDate = maturityDateStr ? new Date(maturityDateStr) : new Date(startDate.getFullYear() + 5, startDate.getMonth(), startDate.getDate());

        const details = {
            bondId,
            bondName,
            issuer: issuer || 'Government of India',
            couponRate: parseFloat(couponRate) || 0.08,
            minInvestment: parseFloat(minInvestment) || 100,
            maxSubscription: parseFloat(maxSubscription) || 500000,
            startDate,
            maturityDate,
            description: description || `Sovereign Bond ${bondId}`
        };

        const result = await bondService.createManagedBond(details, adminWallet);

        res.json({
            success: true,
            message: `Bond ${bondId} created successfully.`,
            data: result
        });

    } catch (error: any) {
        console.error('[API] Create Bond error:', error.message);
        res.status(500).json({ error: 'Failed to create bond: ' + error.message });
    }
});

// ============================================
// START SERVER
// ============================================

export default app;

// Mongoose Connection
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('[CRITICAL] MONGODB_URI is NOT defined in environment variables.');
            console.error('Please add MONGODB_URI=... to your backend/.env file.');
            process.exit(1);
        }
        await mongoose.connect(MONGODB_URI);
        console.log('[API] Connected to MongoDB successfully.');
    } catch (error) {
        console.error('[CRITICAL] MongoDB connection error:', error);
        process.exit(1);
    }
};

// Start Server
connectDB().then(() => {
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
    MongoDB: Connected

    [DEBUG] Loaded Config:
    Gateway: ${config.contracts.gatewayAddress}
    USDT: ${config.contracts.usdtAddress}
    Registry: ${config.contracts.registryAddress}
    =============================================
    `);
    });
});
