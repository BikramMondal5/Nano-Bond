// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityRegistry
 * @dev Maps Wallet Addresses to National Identities (Hashed).
 *      - Acts as the foundational "Digital Passport" system.
 *      - Only verified citizens can holding/trading Sovereign Bonds.
 */
contract IdentityRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // Wallet -> National ID Hash (e.g., keccak256("IND-123456789"))
    mapping(address => bytes32) public nationalIds;
    // Prevent duplicate registrations of the same ID to multiple wallets?
    // For simplicity, we allow 1:1 map. 
    mapping(bytes32 => address) public idToWallet;

    event IdentityVerified(address indexed wallet, bytes32 indexed nationalIdHash);
    event IdentityRevoked(address indexed wallet);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    /**
     * @notice Registers a citizen's wallet.
     * @param wallet The user's wallet address.
     * @param nationalIdHash Hash of the National ID (GDPR/Privacy safe).
     */
    function register(address wallet, bytes32 nationalIdHash) external onlyRole(REGISTRAR_ROLE) {
        require(nationalIds[wallet] == bytes32(0), "Already registered");
        require(idToWallet[nationalIdHash] == address(0), "ID already linked");
        
        nationalIds[wallet] = nationalIdHash;
        idToWallet[nationalIdHash] = wallet; // Bijective map

        emit IdentityVerified(wallet, nationalIdHash);
    }

    /**
     * @notice Revokes a user's status (e.g. lost keys, death).
     */
    function revoke(address wallet) external onlyRole(REGISTRAR_ROLE) {
        bytes32 id = nationalIds[wallet];
        delete nationalIds[wallet];
        delete idToWallet[id];
        
        emit IdentityRevoked(wallet);
    }

    /**
     * @notice Check if a wallet is verified.
     */
    function isVerified(address wallet) external view returns (bool) {
        return nationalIds[wallet] != bytes32(0);
    }
}
