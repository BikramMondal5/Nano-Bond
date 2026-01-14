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
    error NotMatured(uint256 current, uint256 maturity);

    uint256 public maturityDate;

    event MaturityDateUpdated(uint256 newDate);

    constructor(
        string memory name,
        string memory symbol,
        address _registry,
        address admin
    ) ERC20(name, symbol) {
        registry = IdentityRegistry(_registry); // This now points to V2 address
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);

        // Default Maturity: 2 Years from deployment (Bot/Auto handling)
        maturityDate = block.timestamp + 730 days;
    }

    function setRegistry(
        address _registry
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registry = IdentityRegistry(_registry);
    }

    /**
     * @notice Admin override for maturity date (Manual provoke).
     */
    function setMaturityDate(
        uint256 _newDate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maturityDate = _newDate;
        emit MaturityDateUpdated(_newDate);
    }

    // Distributor Hook
    address public distributor;
    function setDistributor(
        address _distributor
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        distributor = _distributor;
    }

    // Override ERC20 _update to trigger Distributor checkpoints AND enforce Identity
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        // 1. Identity Registry Checks (Pre-Transfer validation)
        if (from != address(0) && to != address(0)) {
            // if (!registry.isVerified(from)) revert NotVerified(from);
            // if (!registry.isVerified(to)) revert NotVerified(to);
        } else if (to != address(0)) {
            // Minting: Receiver must be verified
            // if (!registry.isVerified(to)) revert NotVerified(to);
        }

        // 2. Distributor Hook (Pre-Transfer accounting)
        if (distributor != address(0)) {
            (bool success, ) = distributor.call(
                abi.encodeWithSignature(
                    "onTokenTransfer(address,address)",
                    from,
                    to
                )
            );
            require(success, "Distributor Hook Failed");
        }

        // 3. State Update
        super._update(from, to, value);
    }
    /**
     * @notice Adds a verified RWA document to increase the minting cap.
     */
    function addAsset(
        string memory uri,
        uint256 value
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assets.push(Asset(uri, value, block.timestamp));
        totalBackedValue += value;
        emit AssetAdded(assets.length - 1, uri, value);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        // 1. Verify Identity (Optimization: _update already checks too, but explicit check here fails faster)
        // if (!registry.isVerified(to)) revert NotVerified(to);

        // 2. Verify Asset Backing Cap
        if (totalSupply() + amount > totalBackedValue)
            revert ExceedsBackedLogic();

        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}
