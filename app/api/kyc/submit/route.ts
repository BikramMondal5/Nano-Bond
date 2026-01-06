import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import axios from 'axios'
import User from '@/lib/models/User'
import connectDB from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const walletAddress = formData.get('walletAddress') as string
    const walletSignature = formData.get('walletSignature') as string
    const signedMessage = formData.get('signedMessage') as string

    if (!walletAddress || !walletSignature || !signedMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(signedMessage, walletSignature)

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid wallet signature' },
        { status: 400 }
      )
    }

    // Connect to DB
    await connectDB()

    // FIX: Search for user case-insensitively and with better error handling
    const normalizedWallet = walletAddress.toLowerCase()

    console.log('Searching for user with wallet:', normalizedWallet)

    let user = await User.findOne({
      walletAddress: { $regex: new RegExp(`^${normalizedWallet}$`, 'i') }
    })

    // Debug: Check if wallet exists but with different case
    if (!user) {
      const allUsers = await User.find({ walletAddress: { $exists: true, $ne: null } })
      console.log('All wallet addresses in DB:', allUsers.map(u => u.walletAddress))

      return NextResponse.json(
        {
          error: 'User not found. Please ensure your wallet is connected.',
          debug: {
            searchedWallet: normalizedWallet,
            foundWallets: allUsers.map(u => u.walletAddress)
          }
        },
        { status: 404 }
      )
    }

    console.log('Found user:', user._id, user.email)

    // Forward to AI service
    const aiFormData = new FormData()
    aiFormData.append('aadhaar', formData.get('aadhaar') as Blob)
    aiFormData.append('video', formData.get('video') as Blob)

    console.log('Sending to AI service...')

    const aiResponse = await axios.post(
      process.env.AI_KYC_SERVICE_URL + '/verify',
      aiFormData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 90000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    const aiResults = aiResponse.data
    console.log('AI verification results:', aiResults)

    // Determine approval
    const isApproved = (
      aiResults.aadhaarValidation?.isValid &&
      aiResults.aadhaarValidation?.confidence >= 85 &&
      aiResults.livenessDetection?.isLive &&
      aiResults.livenessDetection?.confidence >= 60 &&
      aiResults.fraudScore?.overall <= 30
    )

    console.log('KYC Decision:', isApproved ? 'APPROVED' : 'REJECTED')

    // Update user with KYC results
    const expiresAt = isApproved ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null

    user.kycStatus = isApproved ? 'APPROVED' : 'REJECTED'
    user.kycApprovedAt = isApproved ? new Date() : null
    user.kycExpiresAt = expiresAt
    user.kycRejectionReason = isApproved ? null : generateRejectionReason(aiResults)
    user.aadhaarHash = aiResults.aadhaarHash

    await user.save()

    // Register on blockchain if approved
    if (isApproved) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz')
        const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider)

        const registryABI = [
          "function registerVerified(address wallet, bytes32 aadhaarHash, bytes walletSignature, uint8 riskScore) external"
        ]

        const registry = new ethers.Contract(
          process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_V2_ADDRESS!,
          registryABI,
          wallet
        )

        // Format aadhaarHash as bytes32 (add 0x prefix if missing)
        const formattedHash = aiResults.aadhaarHash.startsWith('0x')
          ? aiResults.aadhaarHash
          : `0x${aiResults.aadhaarHash}`

        const tx = await registry.registerVerified(
          walletAddress,
          formattedHash,
          walletSignature,
          Math.min(aiResults.fraudScore?.overall || 0, 100)
        )

        await tx.wait()
        console.log('Registered on blockchain:', tx.hash)
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError)
        // Don't fail the whole KYC if blockchain fails
      }
    }

    return NextResponse.json({
      success: true,
      status: isApproved ? 'APPROVED' : 'REJECTED',
      message: isApproved ? 'KYC approved successfully' : 'KYC rejected',
      rejectionReason: isApproved ? null : generateRejectionReason(aiResults),
      expiresAt: expiresAt?.toISOString()
    })

  } catch (error: any) {
    console.error('KYC submission error:', error)

    // Handle specific error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'AI verification service is currently unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.error || 'AI verification failed. Please try again.' },
        { status: error.response.status || 500 }
      )
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Verification timeout. Please ensure your files are not too large and try again.' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'KYC submission failed. Please try again.' },
      { status: 500 }
    )
  }
}

function generateRejectionReason(aiResults: any): string {
  const reasons = []

  if (!aiResults.aadhaarValidation?.isValid) {
    reasons.push('Aadhaar validation failed')
  }
  if (aiResults.aadhaarValidation?.confidence < 85) {
    reasons.push('Low Aadhaar confidence score')
  }
  if (!aiResults.livenessDetection?.isLive) {
    reasons.push('Liveness verification failed - please record video showing natural movement')
  }
  if (aiResults.livenessDetection?.confidence < 60) {
    reasons.push('Liveness confidence too low - ensure good lighting and clear face visibility')
  }
  if (aiResults.fraudScore?.overall > 30) {
    reasons.push('High fraud risk detected')
  }
  if (aiResults.fraudScore?.tamperingDetected) {
    reasons.push('Document tampering detected')
  }

  return reasons.join('; ') || 'Verification failed'
}