// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISovereignBond {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract CouponDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken; // USDT (6 decimals)
    ISovereignBond public bond; // Bond (18 decimals)

    event CouponDistributed(uint256 totalAmount, uint256 ratePerShare);
    event CouponClaimed(address indexed user, uint256 amount);
    event ReserveFunded(uint256 amount);
    event YieldDistributed(uint256 rate, uint256 totalCost);

    // Accumulator for "Pull" mechanism
    // Note: cumulativeYieldPerToken is scaled by 1e18 for precision
    // The final reward is in USDT (6 decimals)
    uint256 public cumulativeYieldPerToken;
    mapping(address => uint256) public userPaidPerToken;
    mapping(address => uint256) public rewards; // Stored in USDT decimals (6)
    uint256 public reserve; // USDT reserve (6 decimals)

    // Precision factor: Bond is 18 decimals, USDT is 6 decimals
    // When calculating rewards: (bondBalance * rate) / 1e18 gives USDT amount
    // Rate should be specified as USDT per 1e18 bond tokens
    uint256 private constant PRECISION = 1e18;

    constructor(address _paymentToken, address _bond, address admin) {
        paymentToken = IERC20(_paymentToken);
        bond = ISovereignBond(_bond);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    modifier updateReward(address account) {
        if (account != address(0)) {
            _updateRewardInternal(account);
        }
        _;
    }

    function _updateRewardInternal(address account) internal {
        uint256 bondBalance = bond.balanceOf(account);
        uint256 pendingRate = cumulativeYieldPerToken - userPaidPerToken[account];
        // Calculate earned: (bondBalance * pendingRate) / 1e18
        // bondBalance is 18 decimals, pendingRate is scaled by 1e18
        // Result is in 6 decimal USDT units (since rate is USDT per 1e18 bonds)
        uint256 earned = (bondBalance * pendingRate) / PRECISION;
        rewards[account] += earned;
        userPaidPerToken[account] = cumulativeYieldPerToken;
    }

    // Called by Bond on transfer
    function onTokenTransfer(address from, address to) external {
        require(msg.sender == address(bond), "Only Bond");
        _updateRewardLocal(from);
        _updateRewardLocal(to);
    }

    function _updateRewardLocal(address account) internal {
        if (account != address(0)) {
            _updateRewardInternal(account);
        }
    }

    function fundReserve(uint256 amount) external nonReentrant {
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        reserve += amount;
        emit ReserveFunded(amount);
    }

    /// @notice Distribute yield to all bond holders
    /// @param ratePerToken Amount of USDT (6 decimals) per 1e18 bond tokens
    function distribute(uint256 ratePerToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 supply = bond.totalSupply();
        require(supply > 0, "No bonds minted");

        // Calculate total cost: (supply * ratePerToken) / 1e18
        // supply is 18 decimals, result should be 6 decimal USDT
        uint256 totalCost = (supply * ratePerToken) / PRECISION;
        require(reserve >= totalCost, "Insufficient Reserve");

        reserve -= totalCost;
        cumulativeYieldPerToken += ratePerToken;

        emit YieldDistributed(ratePerToken, totalCost);
    }

    function claim() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "Nothing to claim");
        rewards[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, reward);
        emit CouponClaimed(msg.sender, reward);
    }

    function claimableYield(address user) external view returns (uint256) {
        uint256 current = rewards[user];
        uint256 bondBalance = bond.balanceOf(user);
        uint256 pendingRate = cumulativeYieldPerToken - userPaidPerToken[user];
        uint256 pending = (bondBalance * pendingRate) / PRECISION;
        return current + pending;
    }
}