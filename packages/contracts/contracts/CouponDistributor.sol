// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISovereignBond {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CouponDistributor
 * @dev "Push" model for yield distribution.
 *      - Admin deposits USDT.
 *      - Contract calculates share per token.
 *      - Users claim or Admin pushes.
 */
contract CouponDistributor is AccessControl {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken;     // USDT
    ISovereignBond public bond;     // GBOND
    
    event CouponDistributed(uint256 totalAmount, uint256 ratePerShare);
    event CouponClaimed(address indexed user, uint256 amount);

    constructor(address _paymentToken, address _bond, address admin) {
        paymentToken = IERC20(_paymentToken);
        bond = ISovereignBond(_bond);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Distribute yield to all holders (Simplified).
     * @dev In production, iterating all holders is Gas Prohibitive.
     *      We usually use "Pull" (Merkle Drop) or "Checkpoints".
     *      For this Prototype/DPI Demo: We will assume a small set of holders
     *      OR Implement a simple Pull mechanism.
     *      Let's implement PULL for scalability.
     */
    
    // Total Yield Per Token (Accumulated)
    uint256 public cumulativeYieldPerToken; 
    
    // User's paid checkpoint
    mapping(address => uint256) public userPaidPerToken;
    // Unclaimed rewards buffer
    mapping(address => uint256) public rewards;

    modifier updateReward(address account) {
        if (account != address(0)) {
            uint256 earned = bond.balanceOf(account) * (cumulativeYieldPerToken - userPaidPerToken[account]) / 1e18;
            rewards[account] += earned;
            userPaidPerToken[account] = cumulativeYieldPerToken;
        }
        _;
    }

    /**
     * @notice Hook called by SovereignBond on Transfer/Mint/Burn.
     * @dev Updates rewards for both parties BEFORE their balance changes.
     */
    function onTokenTransfer(address from, address to) external {
        require(msg.sender == address(bond), "Only Bond");
        _updateRewardLocal(from);
        _updateRewardLocal(to);
    }

    function _updateRewardLocal(address account) internal {
        if (account != address(0)) {
            uint256 earned = bond.balanceOf(account) * (cumulativeYieldPerToken - userPaidPerToken[account]) / 1e18;
            rewards[account] += earned;
            userPaidPerToken[account] = cumulativeYieldPerToken;
        }
    }

    // Reserve Logic
    uint256 public reserve;

    event ReserveFunded(uint256 amount);
    event YieldDistributed(uint256 rate, uint256 totalCost);

    /**
     * @notice Admin funds the contract reserve without distributing immediately.
     */
    function fundReserve(uint256 amount) external {
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        reserve += amount;
        emit ReserveFunded(amount);
    }

    /**
     * @notice Distribute a specific Rate (e.g. 0.08 USDT per Bond).
     * @param ratePerToken Amount of Yield per 1 Bond (18 decimals).
     */
    function distribute(uint256 ratePerToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 supply = bond.totalSupply();
        require(supply > 0, "No bonds minted");

        uint256 totalCost = (supply * ratePerToken) / 1e18; // supply is 18 dec, rate is 18 dec. result should be 18 dec?
        // Wait. Supply 100 * 1e18. Rate 0.08 * 1e18. 
        // Cost = (100e18 * 0.08e18) / 1e18 = 8e18. Correct.
        
        // Wait, supply is 18 decimals? Yes, Bond is ERC20.
        // Rate is "USDT per 1.0 Bond".
        // Example: Rate 1e6 (1 USDT) per 1e18 Bond.
        // Cost = 100e18 * 1e6 / 1e18 = 100e6. Correct.
        
        require(reserve >= totalCost, "Insufficient Reserve");
        
        reserve -= totalCost;
        cumulativeYieldPerToken += ratePerToken; // Rate must be scaled to 18 decimals for accumulating?
        // cumulativeYieldPerToken is used as: balance * (cum - paid) / 1e18.
        // Balance = 1e18. Result = 1e18 * Rate / 1e18 = Rate.
        // So Rate should be in PAYMENT TOKEN UNITS normalized?
        // If PaymentToken is 6 decimals. Rate is 6 decimals?
        // If Rate is 6 decimals (e.g. 1e6).
        // Result = 100e18 * 1e6 / 1e18 = 100e6. Correct.
        
        emit YieldDistributed(ratePerToken, totalCost);
    }

    /**
     * @notice Legacy support or Direct Distribution (Amount / Supply).
     */
    function depositYield(uint256 amount) external {
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 supply = bond.totalSupply();
        require(supply > 0, "No bonds minted");
        
        // Rate = (Amount * 1e18) / Supply
        // If Amount 100e6. Supply 100e18.
        // Rate = 100e6 * 1e18 / 100e18 = 1e6.
        uint256 rate = (amount * 1e18) / supply;
        cumulativeYieldPerToken += rate;
        
        emit CouponDistributed(amount, rate);
    }

    /**
     * @notice User claims their share.
     */
    function claim() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "Nothing to claim");
        
        rewards[msg.sender] = 0;
        
        paymentToken.safeTransfer(msg.sender, reward);
        
        emit CouponClaimed(msg.sender, reward);
    }

    // View function for UI
    function claimableYield(address user) external view returns (uint256) {
        uint256 current = rewards[user];
        uint256 pending = bond.balanceOf(user) * (cumulativeYieldPerToken - userPaidPerToken[user]) / 1e18;
        return current + pending;
    }
}
