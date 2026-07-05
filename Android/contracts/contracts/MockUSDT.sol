// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MockUSDT is ERC20, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Flag to enable/disable demo mode (ONLY for testnet)
    bool public demoMode;

    constructor() ERC20("Mock USDT", "USDT") ERC20Permit("Mock USDT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _mint(msg.sender, 1000000 * 10 ** decimals());
        demoMode = true; // Enable demo mode by default for testnet
    }

    /// @notice Mint tokens - restricted to MINTER_ROLE
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /// @notice Burn tokens - only sender can burn their own tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Admin burn - for authorized burning (e.g., redemption flows)
    function burnFrom(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
    }

    /// @notice Set demo mode (admin only)
    function setDemoMode(bool _demoMode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        demoMode = _demoMode;
    }

    // DEMO ONLY: Allow any signature to pass for testing "Gasless" flow
    // WARNING: This is only safe on testnet with demoMode enabled
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        if (demoMode) {
            // Demo mode: Just approve (simulate valid signature)
            _approve(owner, spender, value);
        } else {
            // Production mode: Verify signature properly
            super.permit(owner, spender, value, deadline, v, r, s);
        }
    }
}