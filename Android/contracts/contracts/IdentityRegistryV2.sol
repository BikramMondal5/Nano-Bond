// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityRegistryV2
 * @notice Automated KYC registry with AI verification and wallet binding
 * @dev Stores only cryptographic proofs, never raw identity data
 */
contract IdentityRegistryV2 is AccessControl {
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    struct IdentityProof {
        bytes32 kycHash;        // keccak256(aadhaarHash + walletSignature)
        uint256 verifiedAt;     // Timestamp of verification
        uint256 expiresAt;      // KYC expiry (365 days from verification)
        bool isRevoked;         // Admin revocation flag
        uint8 riskScore;        // 0-100 (AI fraud score, 0 = lowest risk)
    }

    // Wallet => Identity Proof
    mapping(address => IdentityProof) public identities;
    
    // Prevent duplicate Aadhaar usage
    mapping(bytes32 => address) public aadhaarHashToWallet;

    event IdentityVerified(
        address indexed wallet,
        bytes32 indexed kycHash,
        uint256 expiresAt,
        uint8 riskScore
    );
    
    event IdentityRevoked(address indexed wallet, string reason);
    event IdentityExpired(address indexed wallet);

    error AlreadyVerified(address wallet);
    error AadhaarAlreadyUsed(address existingWallet);
    error NotVerified(address wallet);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_VERIFIER_ROLE, admin);
        _grantRole(REVOKER_ROLE, admin);
    }

    /**
     * @notice Register verified identity (called by AI backend)
     * @param wallet User's wallet address
     * @param aadhaarHash keccak256(aadhaarNumber)
     * @param walletSignature User's signature binding identity to wallet
     * @param riskScore AI-calculated fraud score (0-100)
     */
    function registerVerified(
        address wallet,
        bytes32 aadhaarHash,
        bytes memory walletSignature,
        uint8 riskScore
    ) external onlyRole(KYC_VERIFIER_ROLE) {
        // 1. Check if wallet already verified
        if (identities[wallet].verifiedAt != 0 && !identities[wallet].isRevoked) {
            revert AlreadyVerified(wallet);
        }

        // 2. Check if Aadhaar already linked to another wallet
        address existingWallet = aadhaarHashToWallet[aadhaarHash];
        if (existingWallet != address(0) && existingWallet != wallet) {
            revert AadhaarAlreadyUsed(existingWallet);
        }

        // 3. Generate KYC hash (Aadhaar + Signature binding)
        bytes32 kycHash = keccak256(abi.encodePacked(aadhaarHash, walletSignature));

        // 4. Store identity proof
        uint256 expiresAt = block.timestamp + 365 days;
        identities[wallet] = IdentityProof({
            kycHash: kycHash,
            verifiedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            riskScore: riskScore
        });

        aadhaarHashToWallet[aadhaarHash] = wallet;

        emit IdentityVerified(wallet, kycHash, expiresAt, riskScore);
    }

    /**
     * @notice Revoke identity (compliance/fraud action)
     */
    function revoke(address wallet, string calldata reason) 
        external 
        onlyRole(REVOKER_ROLE) 
    {
        if (identities[wallet].verifiedAt == 0) revert NotVerified(wallet);
        
        identities[wallet].isRevoked = true;
        emit IdentityRevoked(wallet, reason);
    }

    /**
     * @notice Check if wallet is verified and not expired/revoked
     */
    function isVerified(address wallet) external view returns (bool) {
        IdentityProof memory proof = identities[wallet];
        
        if (proof.verifiedAt == 0) return false;
        if (proof.isRevoked) return false;
        if (block.timestamp > proof.expiresAt) return false;
        
        return true;
    }

    /**
     * @notice Get identity details
     */
    function getIdentity(address wallet) 
        external 
        view 
        returns (
            bytes32 kycHash,
            uint256 verifiedAt,
            uint256 expiresAt,
            bool isRevoked,
            uint8 riskScore
        ) 
    {
        IdentityProof memory proof = identities[wallet];
        return (
            proof.kycHash,
            proof.verifiedAt,
            proof.expiresAt,
            proof.isRevoked,
            proof.riskScore
        );
    }
}