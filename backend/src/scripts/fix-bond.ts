
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Bond } from '../models/Bond'; // Adjust path if needed
import { config } from '../config';

dotenv.config();

const FIX_BOND_ID = '419888';

async function fixBond() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the problematic bond
        const bond = await Bond.findOne({ bondId: FIX_BOND_ID });

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
        const treasury = config.contracts.treasuryAddress || '0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11';
        const distributor = config.contracts.distributorAddress || '0x956D938378484AbADf0873ca7bC94c0203e76584';
        const token = config.contracts.bondAddress || '0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02';

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

    } catch (error) {
        console.error('Error fixing bond:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixBond();
