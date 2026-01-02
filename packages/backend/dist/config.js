"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    bybit: {
        key: process.env.BYBIT_API_KEY || '',
        secret: process.env.BYBIT_API_SECRET || '',
        testnet: true,
    },
    rpc: {
        url: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    },
    contracts: {
        distributorAddress: process.env.COUPON_DISTRIBUTOR_ADDRESS || '',
        bondAddress: process.env.SOVEREIGN_BOND_ADDRESS || '',
        usdtAddress: process.env.USDT_ADDRESS || '',
    },
    admin: {
        privateKey: process.env.PRIVATE_KEY || '',
    }
};
