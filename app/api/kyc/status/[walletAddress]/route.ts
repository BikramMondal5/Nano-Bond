import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import KYCVerification from '@/lib/models/KYCVerification';

export async function GET(
  request: Request,
  props: { params: Promise<{ walletAddress: string }> }
) {
  const params = await props.params;
  try {
    const { walletAddress } = params;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    await connectDB();

    // Query by walletAddress (case-insensitive)
    const record = await KYCVerification.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!record) {
      return NextResponse.json({
        isVerified: false,
        status: 'NOT_SUBMITTED'
      });
    }

    // Check if status is APPROVED
    const isVerified = record.kycStatus === 'APPROVED';

    return NextResponse.json({
      isVerified,
      status: record.kycStatus,
      kycApprovedAt: record.kycApprovedAt
    });

  } catch (error) {
    console.error('Error checking KYC status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}