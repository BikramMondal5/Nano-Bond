"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// specific debug for this issue
const backendEnvPath = path_1.default.resolve(process.cwd(), 'backend', '.env');
const cwdEnvPath = path_1.default.resolve(process.cwd(), '.env');
console.log(`[Config] Loading config. CWD: ${process.cwd()}`);
if (fs_1.default.existsSync(backendEnvPath)) {
    console.log('[Config] Found backend .env at CWD/backend/.env');
    dotenv_1.default.config({ path: backendEnvPath });
}
else if (fs_1.default.existsSync(cwdEnvPath)) {
    console.log('[Config] Found .env at CWD/.env');
    dotenv_1.default.config({ path: cwdEnvPath });
}
else {
    // Fallback for when running inside backend dir
    const localEnv = path_1.default.resolve(__dirname, '../.env');
    console.log(`[Config] Trying local env: ${localEnv}`);
    dotenv_1.default.config({ path: localEnv });
}
// Try to load deployed_addresses.json
let deployedAddresses = {};
try {
    const addressesPath = path_1.default.resolve(process.cwd(), 'contracts/deployed_addresses.json');
    if (fs_1.default.existsSync(addressesPath)) {
        console.log(`[Config] Loading addresses from ${addressesPath}`);
        deployedAddresses = JSON.parse(fs_1.default.readFileSync(addressesPath, 'utf8'));
    }
    else {
        // Try one level up if we are in backend dir
        const addressesPathUp = path_1.default.resolve(process.cwd(), '../contracts/deployed_addresses.json');
        if (fs_1.default.existsSync(addressesPathUp)) {
            console.log(`[Config] Loading addresses from ${addressesPathUp}`);
            deployedAddresses = JSON.parse(fs_1.default.readFileSync(addressesPathUp, 'utf8'));
        }
    }
}
catch (error) {
    console.warn('[Config] Failed to load deployed_addresses.json:', error);
}
console.log(`[Config] PRIVATE_KEY present: ${!!process.env.PRIVATE_KEY}`);
console.log(`[Config] RPC_URL present: ${!!process.env.RPC_URL}`);
exports.config = {
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
