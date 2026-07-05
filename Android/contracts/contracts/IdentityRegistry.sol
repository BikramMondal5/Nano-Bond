// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityRegistry
 * @notice Automated KYC registry with AI verification and wallet binding
 * @dev Stores only cryptographic proofs, never raw identity data.
 */
contract IdentityRegistry is AccessControl {
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    struct IdentityProof {
        bytes32 kycHash;    // keccak256(aadhaarHash + walletSignature)
        bytes32 aadhaarHash; // Store aadhaar hash for cleanup on revoke
        uint256 verifiedAt; // Timestamp of verification
        uint256 expiresAt;  // KYC expiry (365 days)
        bool isRevoked;     // Admin revocation flag
        uint8 riskScore;    // 0-100 (AI fraud score)
    }

    mapping(address => IdentityProof) public identities;
    mapping(bytes32 => address) public aadhaarHashToWallet;

    event IdentityVerified(address indexed wallet, bytes32 indexed kycHash, uint256 expiresAt, uint8 riskScore);
    event IdentityRevoked(address indexed wallet, string reason);
    event AadhaarUnlinked(bytes32 indexed aadhaarHash, address indexed wallet);

    error AlreadyVerified(address wallet);
    error AadhaarAlreadyUsed(address existingWallet);
    error NotVerified(address wallet);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_VERIFIER_ROLE, admin);
        _grantRole(REVOKER_ROLE, admin);
    }

    /**
     * @notice Register verified identity (called by backend)
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

        // 3. Generate KYC hash
        bytes32 kycHash = keccak256(abi.encodePacked(aadhaarHash, walletSignature));

        // 4. Store identity proof (including aadhaarHash for cleanup)
        uint256 expiresAt = block.timestamp + 365 days;
        identities[wallet] = IdentityProof({
            kycHash: kycHash,
            aadhaarHash: aadhaarHash,
            verifiedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            riskScore: riskScore
        });
        aadhaarHashToWallet[aadhaarHash] = wallet;

        emit IdentityVerified(wallet, kycHash, expiresAt, riskScore);
    }

    /**
     * @notice Revoke identity and optionally unlink Aadhaar
     * @param wallet The wallet to revoke
     * @param reason Reason for revocation
     * @param unlinkAadhaar If true, clears the Aadhaar mapping so it can be re-linked
     */
    function revoke(address wallet, string calldata reason, bool unlinkAadhaar) external onlyRole(REVOKER_ROLE) {
        if (identities[wallet].verifiedAt == 0) revert NotVerified(wallet);
        
        identities[wallet].isRevoked = true;
        
        // Optionally clear Aadhaar mapping to allow re-linking
        if (unlinkAadhaar) {
            bytes32 aadhaarHash = identities[wallet].aadhaarHash;
            if (aadhaarHash != bytes32(0)) {
                delete aadhaarHashToWallet[aadhaarHash];
                emit AadhaarUnlinked(aadhaarHash, wallet);
            }
        }
        
        emit IdentityRevoked(wallet, reason);
    }

    /// @notice Legacy revoke function for backwards compatibility
    function revoke(address wallet, string calldata reason) external onlyRole(REVOKER_ROLE) {
        if (identities[wallet].verifiedAt == 0) revert NotVerified(wallet);
        identities[wallet].isRevoked = true;
        emit IdentityRevoked(wallet, reason);
    }

    function isVerified(address wallet) external view returns (bool) {
        IdentityProof memory proof = identities[wallet];
        if (proof.verifiedAt == 0) return false;
        if (proof.isRevoked) return false;
        if (block.timestamp > proof.expiresAt) return false;
        return true;
    }

    function getIdentity(address wallet) external view returns (bytes32, uint256, uint256, bool, uint8) {
        IdentityProof memory proof = identities[wallet];
        return (proof.kycHash, proof.verifiedAt, proof.expiresAt, proof.isRevoked, proof.riskScore);
    }

    /// @notice Manually unlink an Aadhaar hash (admin only)
    function unlinkAadhaar(bytes32 aadhaarHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address linkedWallet = aadhaarHashToWallet[aadhaarHash];
        require(linkedWallet != address(0), "Aadhaar not linked");
        delete aadhaarHashToWallet[aadhaarHash];
        emit AadhaarUnlinked(aadhaarHash, linkedWallet);
    }
}