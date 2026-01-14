
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';
import fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// ABI Constants
const TREASURY_ABI = [
    "constructor(address,address,address)",
    "function grantRole(bytes32, address) external"
];
const DISTRIBUTOR_ABI = [
    "constructor(address,address,address)",
    "function grantRole(bytes32, address) external"
];
const BOND_ABI = [
    "function grantRole(bytes32, address) external",
    "function hasRole(bytes32, address) view returns (bool)"
];

async function main() {
    console.log("=== REPAIRING GOI-2030 ===");
    await mongoose.connect(process.env.MONGODB_URI!);

    const BOND_ID = "GOI-2030";
    const bondDoc = await Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) { console.error("Bond not found"); return; }

    console.log(`Current Bond Address: ${bondDoc.contractAddress}`);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey!, provider);
    const TARGET_ADMIN = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";

    // 1. Deploy New Treasury (Correct USDT)
    // Args: _paymentToken, _bond, _admin
    // Note: Treasury constructor args might differ. Checking TreasurySwap.sol...
    // constructor(address _paymentToken, address _bond, address admin)

    const CORRECT_USDT = config.contracts.usdtAddress; // 0xF62f...

    console.log("Deploying New Treasury...");
    const TreasuryFactory = new ethers.ContractFactory(
        TREASURY_ABI,
        fs.readFileSync(path.join(__dirname, '../../contracts/artifacts/contracts/TreasurySwap.sol/TreasurySwap.json')).toString(),
        wallet
    );
    // Wait, reading artifact JSON manually is brittle. accessing ABI/Bytecode is better.
    // I'll assume artifacts are in `contracts/artifacts/...`
}
// Aborting manual script write to use standard check first.
