import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// specific debug for this issue
const backendEnvPath = path.resolve(process.cwd(), 'backend', '.env');
console.log(`[Config] Loading config. CWD: ${process.cwd()}, backendEnvPath: ${backendEnvPath}`);

if (fs.existsSync(backendEnvPath)) {
    console.log('[Config] Found backend .env at CWD/backend/.env');
    dotenv.config({ path: backendEnvPath });
} else {
    // Fallback for when running inside backend dir
    const localEnv = path.resolve(__dirname, '../.env');
    console.log(`[Config] Trying local env: ${localEnv}`);
    dotenv.config({ path: localEnv });
}

console.log(`[Config] PRIVATE_KEY present: ${!!process.env.PRIVATE_KEY}`);
console.log(`[Config] RPC_URL present: ${!!process.env.RPC_URL}`);


export const config = {
    rpc: {
        url: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    },
    contracts: {
        distributorAddress: process.env.COUPON_DISTRIBUTOR_ADDRESS || '',
        bondAddress: process.env.SOVEREIGN_BOND_ADDRESS || '',
        usdtAddress: process.env.USDT_ADDRESS || '',
        registryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || '',
        gatewayAddress: process.env.SWAP_GATEWAY_ADDRESS || '',
        treasuryAddress: process.env.TREASURY_SWAP_ADDRESS || '',
    },
    admin: {
        privateKey: process.env.PRIVATE_KEY || '',
    },
    bybit: {
        key: process.env.BYBIT_KEY || '',
        secret: process.env.BYBIT_SECRET || '',
        testnet: process.env.BYBIT_TESTNET === 'true',
    }
};

