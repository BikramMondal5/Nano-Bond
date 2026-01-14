
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("=== REPAIRING GOI-2030 ===");
    await mongoose.connect(process.env.MONGODB_URI!);

    const BOND_ID = "GOI-2030";
    const bondDoc = await Bond.findOne({ bondId: BOND_ID }) as any;
    if (!bondDoc) { console.error("Bond not found"); return; }

    console.log(`Bond: ${bondDoc.contractAddress}`);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey!, provider);
    const TARGET_ADMIN = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    const CORRECT_USDT = config.contracts.usdtAddress;

    // Load Artifacts
    const treasuryArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../contracts/artifacts/contracts/TreasurySwap.sol/TreasurySwap.json'), 'utf8'));
    const distArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../contracts/artifacts/contracts/CouponDistributor.sol/CouponDistributor.json'), 'utf8'));
    const bondArtifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../contracts/artifacts/contracts/SovereignBond.sol/SovereignBond.json'), 'utf8'));

    // 1. Deploy New Treasury
    console.log("Deploying New Treasury with USDT:", CORRECT_USDT);
    const TreasuryFactory = new ethers.ContractFactory(treasuryArtifact.abi, treasuryArtifact.bytecode, wallet);
    const treasury = await TreasuryFactory.deploy(CORRECT_USDT, bondDoc.contractAddress, wallet.address) as any;
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log("✅ New Treasury:", treasuryAddress);

    // 2. Deploy New Distributor
    console.log("Deploying New Distributor...");
    const DistFactory = new ethers.ContractFactory(distArtifact.abi, distArtifact.bytecode, wallet);
    const distributor = await DistFactory.deploy(CORRECT_USDT, bondDoc.contractAddress, wallet.address) as any;
    await distributor.waitForDeployment();
    const distAddress = await distributor.getAddress();
    console.log("✅ New Distributor:", distAddress);

    // 3. Grant Roles
    console.log("Configuring Roles...");
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const MINTER_ROLE = ethers.id("MINTER_ROLE");

    // Grant Admin on New Contracts to Target User
    await (await treasury.grantRole(DEFAULT_ADMIN_ROLE, TARGET_ADMIN)).wait();
    await (await distributor.grantRole(DEFAULT_ADMIN_ROLE, TARGET_ADMIN)).wait();
    console.log("✅ Granted Admin to User on New Contracts");

    // Connect to BOND and Grant Minter to New Treasury
    const bondContract = new ethers.Contract(bondDoc.contractAddress, bondArtifact.abi, wallet);
    try {
        await (await bondContract.grantRole(MINTER_ROLE, treasuryAddress)).wait();
        console.log("✅ Bond: Granted Minter to New Treasury");
    } catch (e: any) {
        console.error("Bond Role Grant Failed (Check ownership):", e.message);
    }

    // Grant Admin on Bond to Target User (just in case)
    try {
        // Check first
        const has = await bondContract.hasRole(DEFAULT_ADMIN_ROLE, TARGET_ADMIN);
        if (!has) {
            await (await bondContract.grantRole(DEFAULT_ADMIN_ROLE, TARGET_ADMIN)).wait();
            console.log("✅ Bond: Granted Admin to User");
        }
    } catch (e: any) {
        console.warn("Bond Admin Grant Failed:", e.message);
    }

    // 4. Update Database
    console.log("Updating Database...");
    bondDoc.treasuryAddress = treasuryAddress;
    bondDoc.distributorAddress = distAddress;
    await bondDoc.save();
    console.log("✅ Database Updated");

    await mongoose.disconnect();
    console.log("=== REPAIR COMPLETE ===");
}

main();
