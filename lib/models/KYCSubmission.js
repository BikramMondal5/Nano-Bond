const mongoose = require('mongoose');

const kycSubmissionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  
  // User-provided data (never stored raw)
  aadhaarHash: {
    type: String,
    required: true,
    unique: true // Prevent duplicate Aadhaar
  },
  
  walletSignature: {
    type: String,
    required: true
  },
  
  // AI Verification Results
  aiVerification: {
    ocrResults: {
      aadhaarNumber: String, // Last 4 digits only
      name: String,
      dob: Date,
      extractedSuccessfully: Boolean
    },
    
    aadhaarValidation: {
      isValid: Boolean,
      confidence: Number, // 0-100
      method: String // "UIDAI_XML" | "IMAGE_FORENSICS"
    },
    
    faceMatch: {
      score: Number, // 0-1 (similarity)
      passed: Boolean, // >= 0.85 threshold
      model: String // "FaceNet" | "DeepFace"
    },
    
    livenessDetection: {
      isLive: Boolean,
      confidence: Number,
      method: String // "VIDEO_ANALYSIS" | "BLINK_DETECTION"
    },
    
    fraudScore: {
      overall: Number, // 0-100 (0 = no fraud detected)
      duplicateCheck: Boolean,
      deepfakeScore: Number,
      tamperingDetected: Boolean
    }
  },
  
  // Final Decision
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
    default: 'PENDING'
  },
  
  rejectionReason: String,
  
  // Blockchain Registration
  blockchainTxHash: String,
  registeredOnChain: {
    type: Boolean,
    default: false
  },
  
  // Expiry Management
  expiresAt: Date, // 365 days from approval
  reKycRequired: {
    type: Boolean,
    default: false
  },
  
  // Audit Trail
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  
  ipAddress: String,
  userAgent: String
  
}, { timestamps: true });

// Indexes for performance
kycSubmissionSchema.index({ status: 1, expiresAt: 1 });
kycSubmissionSchema.index({ 'aiVerification.fraudScore.overall': 1 });

module.exports = mongoose.model('KYCSubmission', kycSubmissionSchema);