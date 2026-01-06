const mongoose = require('mongoose');

/**
 * @notice Tracks Aadhaar usage to prevent duplicates
 * @dev Stores only hashed Aadhaar, never plaintext
 */
const aadhaarRegistrySchema = new mongoose.Schema({
  aadhaarHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  linkedWallet: {
    type: String,
    required: true,
    lowercase: true
  },
  
  registeredAt: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('AadhaarRegistry', aadhaarRegistrySchema);