// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITreasury {
    function buyFor(uint256 amount, address beneficiary) external;
}

contract InvestmentGateway is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public usdt;
    
    event InvestmentForwarded(address indexed user, uint256 amount, address bondAddress);
    event PermitUsed(address indexed user, uint256 amount);
    event PermitFailed(address indexed user, string reason);

    constructor(address _usdt) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
    }

    function investWithPermit(
        address user,
        uint256 amount,
        address treasury,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner nonReentrant {
        // 1. Check existing allowance first
        uint256 existingAllowance = usdt.allowance(user, address(this));
        
        // 2. Execute Permit only if needed
        if (existingAllowance < amount) {
            try IERC20Permit(address(usdt)).permit(user, address(this), amount, deadline, v, r, s) {
                emit PermitUsed(user, amount);
            } catch Error(string memory reason) {
                // Log the failure but continue if allowance is sufficient
                emit PermitFailed(user, reason);
                // Re-check allowance after permit attempt
                require(usdt.allowance(user, address(this)) >= amount, "Permit failed and insufficient allowance");
            } catch {
                emit PermitFailed(user, "Unknown permit error");
                require(usdt.allowance(user, address(this)) >= amount, "Permit failed and insufficient allowance");
            }
        }

        // 3. Pull Funds
        usdt.safeTransferFrom(user, address(this), amount);
        
        // 4. Approve Treasury
        usdt.approve(treasury, amount);
        
        // 5. Buy Bond
        ITreasury(treasury).buyFor(amount, user);
        emit InvestmentForwarded(user, amount, treasury);
    }

    /// @notice Withdraw any stuck tokens (owner only)
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}