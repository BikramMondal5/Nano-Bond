// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISovereignBond {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function maturityDate() external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract TreasurySwap is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken; // USDT
    ISovereignBond public bond; // GBOND

    event BondPurchased(address indexed buyer, uint256 amount);
    event BondRedeemed(address indexed seller, uint256 amount);

    constructor(address _paymentToken, address _bond, address admin) {
        paymentToken = IERC20(_paymentToken);
        bond = ISovereignBond(_bond);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // Buy Bonds (Msg.sender -> Bond)
    function buy(uint256 amount) external nonReentrant {
        buyFor(amount, msg.sender);
    }

    // Buy Bonds for a beneficiary
    function buyFor(uint256 amount, address beneficiary) public nonReentrant {
        // 1. Receive Payment (USDT - 6 decimals)
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // 2. Mint Bond (Bond - 18 decimals)
        uint256 bondAmount = amount * 1e12;
        
        bond.mint(beneficiary, bondAmount);
        emit BondPurchased(beneficiary, bondAmount);
    }

    // Admin Mint (Gasless Service)
    function adminMint(address beneficiary, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 bondAmount = amount * 1e12;
        bond.mint(beneficiary, bondAmount);
        emit BondPurchased(beneficiary, bondAmount);
    }

    // Redeem Bonds after Maturity
    // Users must first approve this contract to spend their bonds
    function redeem(uint256 bondAmount) external nonReentrant {
        if (block.timestamp < bond.maturityDate()) {
            revert("Bond not matured yet");
        }

        // Treasury must have MINTER_ROLE on Bond contract to call burn
        // User must have approved Treasury to burn their bonds
        bond.burn(msg.sender, bondAmount);

        // Send USDT back (Convert 18 -> 6 decimals)
        uint256 usdtAmount = bondAmount / 1e12;
        paymentToken.safeTransfer(msg.sender, usdtAmount);

        emit BondRedeemed(msg.sender, usdtAmount);
    }

    function withdrawReserves(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paymentToken.safeTransfer(to, amount);
    }
}