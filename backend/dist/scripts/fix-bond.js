"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Bond_1 = require("../models/Bond"); // Adjust path if needed
const config_1 = require("../config");
dotenv_1.default.config();
const FIX_BOND_ID = '419888';
async function fixBond() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        // 1. Find the problematic bond
        const bond = await Bond_1.Bond.findOne({ bondId: FIX_BOND_ID });
        if (!bond) {
            console.log(`Bond ${FIX_BOND_ID} not found in DB. Nothing to fix.`);
            return;
        }
        console.log(`Found bond: ${bond.bondName} (${bond.bondId})`);
        console.log('Current Config:', {
            treasury: bond.treasuryAddress,
            distributor: bond.distributorAddress
        });
        // 2. Update with default contracts from config (or GOI-2030 values)
        // using config.contracts which are loaded from env
        const treasury = config_1.config.contracts.treasuryAddress || '0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11';
        const distributor = config_1.config.contracts.distributorAddress || '0x956D938378484AbADf0873ca7bC94c0203e76584';
        const token = config_1.config.contracts.bondAddress || '0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02';
        bond.treasuryAddress = treasury;
        bond.distributorAddress = distributor;
        bond.contractAddress = token;
        await bond.save();
        console.log('✅ Bond updated successfully with addresses:');
        console.log({
            treasury,
            distributor,
            contractAddress: token
        });
    }
    catch (error) {
        console.error('Error fixing bond:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
fixBond();
