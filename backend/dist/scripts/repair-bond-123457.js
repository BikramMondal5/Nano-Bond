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
    const BOND_ID = '123457';
    console.log(`REPAIRING Bond ${BOND_ID}...`);
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    if (!config_1.config.admin.privateKey) {
        console.error("Missing Admin Key");
        return;
    }
    const service = new deployment_service_1.DeploymentService();
    // 1. Redeploy
    const deployment = await service.deployBondProduct(`REPAIRED Bond ${BOND_ID}`, BOND_ID);
    console.log(`✅ FRESH DEPLOYMENT for ${BOND_ID} COMPLETE:`);
    console.log(`Bond:       ${deployment.contractAddress}`);
    console.log(`Treasury:   ${deployment.treasuryAddress}`);
    // 2. Verify USDT
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const treasury = new ethers_1.ethers.Contract(deployment.treasuryAddress, ["function paymentToken() view returns (address)"], provider);
    const token = await treasury.paymentToken();
    console.log(`New Treasury USDT: ${token}`);
    if (token.toLowerCase() !== config_1.config.contracts.usdtAddress.toLowerCase()) {
        console.error("❌ STILL WRONG USDT! CHECK CONFIG!");
        process.exit(1);
    }
    // 3. Grant Admin Role
    const userWallet = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d"; // From user request
    const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
    const adminSigner = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const bondContract = new ethers_1.ethers.Contract(deployment.contractAddress, ["function grantRole(bytes32, address) external"], adminSigner);
    console.log(`Granting Admin to ${userWallet}...`);
    await (await bondContract.grantRole(DEFAULT_ADMIN_ROLE, userWallet)).wait();
    console.log("Granted.");
    // 4. Update DB
    console.log("Updating MongoDB...");
    const bondDoc = await Bond_1.Bond.findOne({ bondId: BOND_ID });
    if (bondDoc) {
        bondDoc.contractAddress = deployment.contractAddress;
        bondDoc.treasuryAddress = deployment.treasuryAddress;
        bondDoc.distributorAddress = deployment.distributorAddress;
        bondDoc.status = 'active';
        // Ensure maxSubscription is consistent if needed
        await bondDoc.save();
        console.log("✅ MongoDB Updated.");
    }
    else {
        console.log(`⚠️ Bond ${BOND_ID} doc not found, checking failure...`);
    }
    await mongoose_1.default.disconnect();
}
main();
