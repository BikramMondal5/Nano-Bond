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

    /**
     * @notice Admin deposits Interest (e.g. $1M).
     */
    function depositYield(uint256 amount) external {
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 supply = bond.totalSupply();
        require(supply > 0, "No bonds minted");
        
        // Rate = Amount / Supply 
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
