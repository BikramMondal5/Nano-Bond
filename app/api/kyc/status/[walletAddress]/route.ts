import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    await connectDB()

    const user = await User.findOne({
      walletAddress: params.address.toLowerCase()
    })

    if (!user || !user.kycStatus || user.kycStatus === 'NOT_SUBMITTED') {
      return NextResponse.json({
        isVerified: false,
        status: 'NOT_SUBMITTED'
      })
    }

    // Check expiry
    const isExpired = user.kycExpiresAt && new Date() > new Date(user.kycExpiresAt)

    return NextResponse.json({
      isVerified: user.kycStatus === 'APPROVED' && !isExpired,
      status: isExpired ? 'EXPIRED' : user.kycStatus,
      submittedAt: user.kycApprovedAt?.toISOString(),
      expiresAt: user.kycExpiresAt?.toISOString(),
      reKycRequired: isExpired,
      riskScore: 15 // Can be stored in DB if needed
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}