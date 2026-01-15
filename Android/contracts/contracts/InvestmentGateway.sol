// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITreasury {
    function buyFor(uint256 amount, address beneficiary) external;
}

/**
 * @title InvestmentGateway
 * @notice Atomic Forwarder for Gasless Investments
 * @dev Combines Permit + Transfer + Invest into one transaction.
 */
contract InvestmentGateway is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public usdc;

    event InvestmentForwarded(address indexed user, uint256 amount, address bondAddress);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Execute Atomic Investment
     * @param user The investor's address
     * @param amount Amount of USDC to invest (6 decimals)
     * @param treasury The treasury contract to buy from
     * @param deadline Permit deadline
     * @param v Permit signature V
     * @param r Permit signature R
     * @param s Permit signature S
     */
    function investWithPermit(
        address user,
        uint256 amount,
        address treasury,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        // 1. Execute Permit (Gasless Approval)
        try IERC20Permit(address(usdc)).permit(user, address(this), amount, deadline, v, r, s) {
            // Permit successful
        } catch {
            // If permit fails, it might be that allowance was already set.
            // We continue and let transferFrom fail if no allowance.
        }

        // 2. Pull Funds (User -> Gateway)
        usdc.safeTransferFrom(user, address(this), amount);

        // 3. Approve Treasury (Gateway -> Treasury)
        usdc.approve(treasury, amount);

        // 4. Buy Bond (Treasury pulls from Gateway, mints to User)
        ITreasury(treasury).buyFor(amount, user);

        emit InvestmentForwarded(user, amount, treasury);
    }

    /**
     * @notice Rescue tokens stuck in gateway
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
