// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IdentityRegistry.sol"; 

contract SovereignBond is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IdentityRegistry public registry;

    struct Asset {
        string uri;
        uint256 value;
        uint256 timestamp;
    }
    Asset[] public assets;
    uint256 public totalBackedValue;

    event AssetAdded(uint256 indexed id, string uri, uint256 value);
    event MaturityDateUpdated(uint256 newDate);

    error NotVerified(address user);
    error ExceedsBackedLogic();

    uint256 public maturityDate;
    address public distributor;

    constructor(
        string memory name,
        string memory symbol,
        address _registry,
        address admin
    ) ERC20(name, symbol) {
        registry = IdentityRegistry(_registry);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        maturityDate = block.timestamp + 730 days; // 2 years default
    }

    function setRegistry(address _registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registry = IdentityRegistry(_registry);
    }

    function setMaturityDate(uint256 _newDate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maturityDate = _newDate;
        emit MaturityDateUpdated(_newDate);
    }

    function setDistributor(address _distributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        distributor = _distributor;
    }

    // Override _update to enforce KYC and trigger Distributor
    // Fixed: State change BEFORE external call (CEI pattern)
    function _update(address from, address to, uint256 value) internal override nonReentrant {
        // 1. Identity Registry Checks (ACTIVE)
        if (from != address(0) && to != address(0)) {
            // Regular transfer: Both must be verified
            if (!registry.isVerified(from)) revert NotVerified(from);
            if (!registry.isVerified(to)) revert NotVerified(to);
        } else if (to != address(0)) {
            // Minting: Receiver must be verified
            if (!registry.isVerified(to)) revert NotVerified(to);
        }
        // Burning (to == 0): No strict verification needed for burning usually.

        // 2. State Change FIRST (CEI Pattern - Checks-Effects-Interactions)
        super._update(from, to, value);

        // 3. Distributor Hook AFTER state change
        if (distributor != address(0)) {
            (bool success, ) = distributor.call(
                abi.encodeWithSignature("onTokenTransfer(address,address)", from, to)
            );
            require(success, "Distributor Hook Failed");
        }
    }

    function addAsset(string memory uri, uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assets.push(Asset(uri, value, block.timestamp));
        totalBackedValue += value;
        emit AssetAdded(assets.length - 1, uri, value);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        // Registry check handled in _update, but checking here saves gas if failed
        if (!registry.isVerified(to)) revert NotVerified(to);

        // Verify Asset Backing Cap
        if (totalSupply() + amount > totalBackedValue) revert ExceedsBackedLogic();
        
        _mint(to, amount);
    }

    /// @notice Burn tokens with explicit allowance check for consent
    /// @dev Treasury must have allowance from user OR user must call directly
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        // If caller is not the token owner, require allowance
        if (from != msg.sender) {
            uint256 currentAllowance = allowance(from, msg.sender);
            require(currentAllowance >= amount, "Burn: insufficient allowance");
            _approve(from, msg.sender, currentAllowance - amount);
        }
        _burn(from, amount);
    }

    /// @notice Allow users to burn their own tokens directly
    function burnOwn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}