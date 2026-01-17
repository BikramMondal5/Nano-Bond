
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../models/User';
import { KYCSubmission } from '../models/KYCSubmission';

dotenv.config();

const checkKYC = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }

        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const address = '0x3725931e0d2577d76654e455a0e73a05bc761cc1';
        console.log(`Checking KYC for address: ${address}`);

        const submission = await KYCSubmission.findOne({ walletAddress: address.toLowerCase() });
        console.log('Found submission:', submission);
        if (submission) {
            console.log(`[DEBUG] KYCSubmission STATUS: ${submission.status}`);
        } else {
            console.log('[DEBUG] No KYCSubmission found.');
        }

        const user = await User.findOne({ walletAddress: address.toLowerCase() });
        console.log('Found User:', user);
        if (user) {
            console.log(`[DEBUG] User kycStatus: ${user.kycStatus}`);
        } else {
            console.log('[DEBUG] No User found.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkKYC();
