// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IdentityRegistry.sol";

/**
 * @title SovereignBond
 * @dev Restricted ERC-20 Token representing a National Bond.
 *      - Checks IdentityRegistry on every transfer.
 *      - Minting is controlled by Treasury.
 */
contract SovereignBond is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // Treasury
    
    IdentityRegistry public registry;
    
    // RWA Backing Logic
    struct Asset {
        string uri;
        uint256 value;
        uint256 timestamp;
    }
    Asset[] public assets;
    uint256 public totalBackedValue;

    event AssetAdded(uint256 indexed id, string uri, uint256 value);

    error NotVerified(address user);
    error Unauthorized();
    error ExceedsBackedLogic();

    constructor(string memory name, string memory symbol, address _registry, address admin) 
        ERC20(name, symbol) 
    {
        registry = IdentityRegistry(_registry);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function setRegistry(address _registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registry = IdentityRegistry(_registry);
    }

    /**
     * @notice Adds a verified RWA document to increase the minting cap.
     */
    function addAsset(string memory uri, uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assets.push(Asset(uri, value, block.timestamp));
        totalBackedValue += value;
        emit AssetAdded(assets.length - 1, uri, value);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        // 1. Verify Identity
        if (!registry.isVerified(to)) revert NotVerified(to);
        
        // 2. Verify Asset Backing Cap
        if (totalSupply() + amount > totalBackedValue) revert ExceedsBackedLogic();

        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }

    /**
     * @dev Hook that is called before any transfer of tokens.
     *      - Enforces Identity Compliance.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        // Skip check for Minting (from=0) and Burning (to=0)
        // Actually Minting DOES verify receiver (done in mint function above or here).
        // Let's enforce strictly here.
        
        if (from != address(0) && to != address(0)) {
            // P2P Transfer: Both must be verified? Or just Receiver?
            // Usually, just Receiver needs to be eligible to hold. 
            // Checking sender ensures blacklisted (revoked) users cannot move funds.
            if (!registry.isVerified(from)) revert NotVerified(from);
            if (!registry.isVerified(to)) revert NotVerified(to);
        } else if (to != address(0)) {
            // Minting: Receiver must be verified
            if (!registry.isVerified(to)) revert NotVerified(to);
        }
        
        // Burning: No checks needed usually, or check sender.
        
        super._update(from, to, value);
    }
}
