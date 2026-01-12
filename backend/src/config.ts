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

// Try to load deployed_addresses.json
let deployedAddresses: any = {};
try {
    const addressesPath = path.resolve(process.cwd(), 'contracts/deployed_addresses.json');
    if (fs.existsSync(addressesPath)) {
        console.log(`[Config] Loading addresses from ${addressesPath}`);
        deployedAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    } else {
        // Try one level up if we are in backend dir
        const addressesPathUp = path.resolve(process.cwd(), '../contracts/deployed_addresses.json');
        if (fs.existsSync(addressesPathUp)) {
            console.log(`[Config] Loading addresses from ${addressesPathUp}`);
            deployedAddresses = JSON.parse(fs.readFileSync(addressesPathUp, 'utf8'));
        }
    }
} catch (error) {
    console.warn('[Config] Failed to load deployed_addresses.json:', error);
}

console.log(`[Config] PRIVATE_KEY present: ${!!process.env.PRIVATE_KEY}`);
console.log(`[Config] RPC_URL present: ${!!process.env.RPC_URL}`);


export const config = {
    rpc: {
        url: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    },
    contracts: {
        distributorAddress: process.env.COUPON_DISTRIBUTOR_ADDRESS || deployedAddresses.Distributor || '',
        bondAddress: process.env.SOVEREIGN_BOND_ADDRESS || deployedAddresses.Bond || '',
        usdtAddress: process.env.USDT_ADDRESS || deployedAddresses.USDT || '',
        registryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || deployedAddresses.Registry || '',
        gatewayAddress: process.env.SWAP_GATEWAY_ADDRESS || deployedAddresses.Gateway || '',
        treasuryAddress: process.env.TREASURY_SWAP_ADDRESS || deployedAddresses.Treasury || '',
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

