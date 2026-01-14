import dotenv from 'dotenv';
dotenv.config();

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
    },
    mongodb: {
        uri: process.env.MONGODB_URI || '',
    }
};

