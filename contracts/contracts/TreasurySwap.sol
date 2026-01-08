// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IdentityRegistry.sol";

// Interface for SovereignBond to mint
interface ISovereignBond {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function registry() external view returns (IdentityRegistry);
    function maturityDate() external view returns (uint256);
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
        // 1. Receive Payment from Caller (USDT - 6 decimals)
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // 2. Mint Bond to Beneficiary (Bond - 18 decimals)
        // Convert 6 decimals to 18 decimals -> Multiply by 1e12
        uint256 bondAmount = amount * 1e12;

        // Registry check happens inside bond.mint()
        bond.mint(beneficiary, bondAmount);
        
        emit BondPurchased(beneficiary, bondAmount);
    }

    /**
     * @notice Redeem Bonds for USDT after maturity.
     * @param bondAmount Amount of GBOND to redeem (18 decimals).
     */
    function redeem(uint256 bondAmount) external {
        // 1. Check Maturity "Auto-Bot" Logic
        if (block.timestamp < bond.maturityDate()) {
             revert("Bond not matured yet");
        }

        // 2. Burn Bonds from User
        // Treasury needs BURNER_ROLE or allowance. 
        // We will grant BURNER_ROLE to Treasury in deploy script.
        // It is cleaner if Treasury has MINTER/BURNER role.
        // Or user approves Treasury? 
        // Standard: User approves -> Treasury transfersFrom/burns.
        // If Treasury has BURNER_ROLE on AccessControl, 'burnFrom' usually still requires allowance 
        // UNLESS it's a privileged burn (like 'clawback'). 
        // Let's assume standard flow: User must Approve bond to Treasury?
        // Wait, standard ERC20Burnable 'burnFrom' requires allowance.
        // Our 'burn' in SovereignBond is `onlyRole(MINTER_ROLE)`.
        // It calls `_burn`. 
        // We should add a `burnFrom` or allow Treasury to burn.
        // Let's trust Treasury (Minter role) to burn arbitrary? 
        // Yes, Treasury is the "System".
        // But `_burn` doesn't check allowance. 
        // We should explicitly transfer or just burn if msg.sender is user?
        // Ah, `burn(address from, amount)` is `onlyRole(MINTER_ROLE)`.
        // So Treasury calls `bond.burn(msg.sender, amount)`.
        
        bond.burn(msg.sender, bondAmount);

        // 3. Send USDT back (Convert 18 -> 6 decimals)
        // Divide by 1e12
        uint256 usdtAmount = bondAmount / 1e12;
        paymentToken.safeTransfer(msg.sender, usdtAmount);

        emit BondRedeemed(msg.sender, usdtAmount);
    }

    /**
     * @notice Admin Withdraw of collected Stablecoins.
     */
    function withdrawReserves(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paymentToken.safeTransfer(to, amount);
    }
}
