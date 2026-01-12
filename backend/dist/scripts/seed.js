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
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Bond_1 = require("../models/Bond");
const dotenv = __importStar(require("dotenv")); // Ensure dotenv is used
// Load env vars from .env file inside backend directory (or passed via CLI)
dotenv.config();
// Path to registry
const REGISTRY_PATH = path.join(process.cwd(), 'bond-registry.json');
console.log('Registry Path:', REGISTRY_PATH);
async function seed() {
    // Get MONGODB_URI from env
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');
        // clean old data if you want? No, let's upsert to be safe.
        if (!fs.existsSync(REGISTRY_PATH)) {
            console.error('Registry file not found!');
            process.exit(1);
        }
        const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
        const json = JSON.parse(data);
        const bonds = json.bonds || [];
        console.log(`Found ${bonds.length} bonds in registry.`);
        for (const b of bonds) {
            // Upsert based on bondId
            await Bond_1.Bond.findOneAndUpdate({ bondId: b.bondId }, {
                $set: {
                    bondName: b.bondName,
                    issuer: b.issuer,
                    couponRate: parseFloat(b.couponRate) || 0, // ensure number
                    startDate: new Date(b.startDate),
                    maturityDate: new Date(b.maturityDate),
                    minInvestment: parseFloat(b.minInvestment) || 0,
                    maxSubscription: parseFloat(b.maxSubscription) || 0,
                    description: b.description,
                    category: b.category,
                    contractAddress: b.contractAddress,
                    treasuryAddress: b.treasuryAddress,
                    distributorAddress: b.distributorAddress,
                    proofUrl: b.proofUrl,
                    adminWallet: b.adminWallet,
                    createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
                }
            }, { upsert: true, new: true });
            console.log(`Processed bond: ${b.bondName} (${b.bondId})`);
        }
        console.log('Seeding completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}
seed();
