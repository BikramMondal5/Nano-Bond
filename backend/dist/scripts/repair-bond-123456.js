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
const deployment_service_1 = require("../services/deployment.service");
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
// Load .env
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("REPAIRING Bond 123456...");
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    // Ensure we are using the Backend Admin Key
    if (!config_1.config.admin.privateKey) {
        console.error("Missing Admin Key");
        return;
    }
    const service = new deployment_service_1.DeploymentService();
    // Re-Deploy fresh contracts for 123456
    // This creates NEW contracts on chain.
    const deployment = await service.deployBondProduct("REPAIRED Bond 123456", "123456");
    console.log("✅ FRESH DEPLOYMENT for 123456 COMPLETE:");
    console.log(`Bond:       ${deployment.contractAddress}`);
    console.log(`Treasury:   ${deployment.treasuryAddress}`);
    // Verify USDT on New Treasury
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const treasury = new ethers_1.ethers.Contract(deployment.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
    const token = await treasury.paymentToken();
    console.log(`New Treasury USDT: ${token}`);
    if (token.toLowerCase() !== config_1.config.contracts.usdtAddress.toLowerCase()) {
        console.error("❌ STILL WRONG USDT! CHECK CONFIG!");
        process.exit(1);
    }
    // Grant Admin Role to User (0x68C2...) so they can upload proof manually
    // Since we are repairing the bond they already tried to use.
    const userWallet = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
    const adminSigner = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const bondContract = new ethers_1.ethers.Contract(deployment.contractAddress, ["function grantRole(bytes32, address) external"], adminSigner);
    console.log(`Granting Admin to ${userWallet}...`);
    await (await bondContract.grantRole(DEFAULT_ADMIN_ROLE, userWallet)).wait();
    console.log("Granted.");
    // Update DB
    console.log("Updating MongoDB...");
    const bondDoc = await Bond_1.Bond.findOne({ bondId: '123456' });
    if (bondDoc) {
        bondDoc.contractAddress = deployment.contractAddress;
        bondDoc.treasuryAddress = deployment.treasuryAddress;
        bondDoc.distributorAddress = deployment.distributorAddress;
        bondDoc.status = 'active'; // Reset status
        await bondDoc.save();
        console.log("✅ MongoDB Updated.");
    }
    else {
        console.log("⚠️ Bond 123456 doc not found, creating new...");
        await Bond_1.Bond.create({
            bondId: '123456',
            bondName: 'REPAIRED Bond 123456',
            contractAddress: deployment.contractAddress,
            treasuryAddress: deployment.treasuryAddress,
            distributorAddress: deployment.distributorAddress,
            // Defaults
            couponRate: 0.1,
            minInvestment: 100,
            maxSubscription: 1000000
        });
    }
    await mongoose_1.default.disconnect();
}
main();
