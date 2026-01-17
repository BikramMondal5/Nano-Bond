"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const fs_1 = __importDefault(require("fs"));
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("=== REPAIRING GOI-2030 ===");
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const BOND_ID = "GOI-2030";
    const bondDoc = await Bond_1.Bond.findOne({ bondId: BOND_ID });
    if (!bondDoc) {
        console.error("Bond not found");
        return;
    }
    console.log(`Bond: ${bondDoc.contractAddress}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const wallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const TARGET_ADMIN = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    const CORRECT_USDT = config_1.config.contracts.usdtAddress;
    // Load Artifacts
    const treasuryArtifact = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../../contracts/artifacts/contracts/TreasurySwap.sol/TreasurySwap.json'), 'utf8'));
    const distArtifact = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../../contracts/artifacts/contracts/CouponDistributor.sol/CouponDistributor.json'), 'utf8'));
    const bondArtifact = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../../contracts/artifacts/contracts/SovereignBond.sol/SovereignBond.json'), 'utf8'));
    // 1. Deploy New Treasury
    console.log("Deploying New Treasury with USDT:", CORRECT_USDT);
    const TreasuryFactory = new ethers_1.ethers.ContractFactory(treasuryArtifact.abi, treasuryArtifact.bytecode, wallet);
    const treasury = await TreasuryFactory.deploy(CORRECT_USDT, bondDoc.contractAddress, wallet.address);
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log("✅ New Treasury:", treasuryAddress);
    // 2. Deploy New Distributor
    console.log("Deploying New Distributor...");
    const DistFactory = new ethers_1.ethers.ContractFactory(distArtifact.abi, distArtifact.bytecode, wallet);
    const distributor = await DistFactory.deploy(CORRECT_USDT, bondDoc.contractAddress, wallet.address);
    await distributor.waitForDeployment();
    const distAddress = await distributor.getAddress();
    console.log("✅ New Distributor:", distAddress);
    // 3. Grant Roles
    console.log("Configuring Roles...");
    const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
    const MINTER_ROLE = ethers_1.ethers.id("MINTER_ROLE");
    // Grant Admin on New Contracts to Target User
    await (await treasury.grantRole(DEFAULT_ADMIN_ROLE, TARGET_ADMIN)).wait();
    await (await distributor.grantRole(DEFAULT_ADMIN_ROLE, TARGET_ADMIN)).wait();
    console.log("✅ Granted Admin to User on New Contracts");
    // Connect to BOND and Grant Minter to New Treasury
    const bondContract = new ethers_1.ethers.Contract(bondDoc.contractAddress, bondArtifact.abi, wallet);
    try {
        await (await bondContract.grantRole(MINTER_ROLE, treasuryAddress)).wait();
        console.log("✅ Bond: Granted Minter to New Treasury");
    }
    catch (e) {
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
    }
    catch (e) {
        console.warn("Bond Admin Grant Failed:", e.message);
    }
    // 4. Update Database
    console.log("Updating Database...");
    bondDoc.treasuryAddress = treasuryAddress;
    bondDoc.distributorAddress = distAddress;
    await bondDoc.save();
    console.log("✅ Database Updated");
    await mongoose_1.default.disconnect();
    console.log("=== REPAIR COMPLETE ===");
}
main();
