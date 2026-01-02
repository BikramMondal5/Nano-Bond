// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IdentityRegistry.sol";

// Interface for SovereignBond to mint
interface ISovereignBond {
    function mint(address to, uint256 amount) external;
    function registry() external view returns (IdentityRegistry);
}

/**
 * @title TreasurySwap
 * @dev The "Vending Machine".
 *      - Accepts Stablecoin (USDT).
 *      - Mints Sovereign Bonds 1:1.
 *      - Atomic execution.
 */
contract TreasurySwap is AccessControl {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken;     // USDT
    ISovereignBond public bond;     // GBOND
    
    // Price Grid: 1 Stable = 1 Bond (Standard)
    // We can add price feeds later if needed.
    
    event BondPurchased(address indexed buyer, uint256 amount);
    event BondRedeemed(address indexed seller, uint256 amount);

    constructor(address _paymentToken, address _bond, address admin) {
        paymentToken = IERC20(_paymentToken);
        bond = ISovereignBond(_bond);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Buy Bonds with Stablecoins.
     */
    function buy(uint256 amount) external {
        buyFor(amount, msg.sender);
    }

    /**
     * @notice Buy Bonds for a beneficiary (e.g. via Gateway).
     */
    function buyFor(uint256 amount, address beneficiary) public {
        // 1. Receive Payment from Caller
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // 2. Mint Bond to Beneficiary
        // Registry check happens inside bond.mint()
        bond.mint(beneficiary, amount);
        
        emit BondPurchased(beneficiary, amount);
    }

    /**
     * @notice Admin Withdraw of collected Stablecoins.
     */
    function withdrawReserves(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paymentToken.safeTransfer(to, amount);
    }
}
