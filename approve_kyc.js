const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function approveKyc() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const walletAddress = '0x68c247c1ad1aadc4786c853590bc8a5bd67b3e9d'; // Lowercase
    
    // Update User
    await db.collection('users').updateOne(
        { walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') } },
        { $set: { kycStatus: 'APPROVED', walletAddress: walletAddress } },
        { upsert: true }
    );
    
    // Update KYCSubmission
    await db.collection('kycsubmissions').updateOne(
        { walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') } },
        { $set: { status: 'APPROVED', kycApprovedAt: new Date(), walletAddress: walletAddress } },
        { upsert: true }
    );
    
    console.log(`KYC Approved for ${walletAddress}`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
approveKyc();
