// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ITreasurySwap {
    function buy(uint256 amount) external;
    function buyFor(uint256 amount, address beneficiary) external;
}

// Mock Interface for a DEX Router (Uniswap V2/V3 Style)
interface IRouter {
    function exactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address recipient,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint160 sqrtPriceLimitX96
    ) external payable returns (uint256 amountOut);
}

/**
 * @title SwapGateway
 * @dev "Zap" Contract: Native MNT -> USDT -> TreasurySwap -> Bond.
 *      - Allows 1-click buy from website.
 */
contract SwapGateway is AccessControl {
    
    address public treasurySwap;
    address public usdt;
    address public router; // FusionX or Agni router on Mantle
    address public wmnt;   // Wrapped Native Token

    constructor(address _treasurySwap, address _usdt, address _router, address _wmnt) {
        treasurySwap = _treasurySwap;
        usdt = _usdt;
        router = _router;
        wmnt = _wmnt;
    }

    /**
     * @notice Zap: Send MNT, Get Bond.
     * @dev PROTOTYPE VERSION: Simulates swap by accepting Native, converting to USDT via MockRouter.
     */
    function buyBondWithNative() external payable {
        require(msg.value > 0, "No MNT sent");

        // 1. Swap MNT -> USDT via Router
        // MOCK LOGIC: Call mockSwap on Router
        (bool success, bytes memory data) = router.call{value: msg.value}(
            abi.encodeWithSignature("mockSwap(address)", address(this))
        );
        require(success, "Swap Failed");
        uint256 usdtAmount = abi.decode(data, (uint256));

        // 2. Approve Treasury
        IERC20(usdt).approve(treasurySwap, usdtAmount);

        // 3. Buy Bond FOR the User (msg.sender)
        // If we buy for 'address(this)', it fails because Gateway is not KYC verified!
        ITreasurySwap(treasurySwap).buyFor(usdtAmount, msg.sender);
    }
    
    receive() external payable {}
}
