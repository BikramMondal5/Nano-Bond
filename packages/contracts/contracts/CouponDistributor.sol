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
    
    // User's paid mask
    mapping(address => uint256) public userPaidPerToken;

    /**
     * @notice Admin deposits Interest (e.g. $1M).
     */
    function depositYield(uint256 amount) external {
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 supply = bond.totalSupply();
        require(supply > 0, "No bonds minted");
        
        // Rate = Amount / Supply 
        // Use 1e18 precision
        uint256 rate = (amount * 1e18) / supply;
        cumulativeYieldPerToken += rate;
        
        emit CouponDistributed(amount, rate);
    }

    /**
     * @notice User claims their share.
     */
    function claim() external {
        uint256 bal = bond.balanceOf(msg.sender);
        require(bal > 0, "No bonds held");
        
        uint256 owedRate = cumulativeYieldPerToken - userPaidPerToken[msg.sender];
        require(owedRate > 0, "Nothing to claim");
        
        uint256 reward = (bal * owedRate) / 1e18;
        
        userPaidPerToken[msg.sender] = cumulativeYieldPerToken;
        
        paymentToken.safeTransfer(msg.sender, reward);
        
        emit CouponClaimed(msg.sender, reward);
    }
}
