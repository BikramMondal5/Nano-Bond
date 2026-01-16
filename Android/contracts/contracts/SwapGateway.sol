// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ITreasurySwap {
    function buyFor(uint256 amount, address beneficiary) external;
}

// Mock Interface for testing zap
interface IRouter {
    function mockSwap(address to) external payable returns (uint256);
}

contract SwapGateway is AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    address public treasurySwap;
    address public usdt;
    address public router; 

    event NativeBondPurchase(address indexed buyer, uint256 nativeAmount, uint256 usdtAmount);
    event NativeWithdrawn(address indexed to, uint256 amount);

    constructor(address _treasurySwap, address _usdt, address _router, address admin) {
        treasurySwap = _treasurySwap;
        usdt = _usdt;
        router = _router;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    function buyBondWithNative() external payable {
        require(msg.value > 0, "No Value Sent");

        // 1. Swap Native -> USDT (via MockRouter)
        // returns amount of USDT received
        uint256 usdtAmount = IRouter(router).mockSwap{value: msg.value}(address(this));

        // 2. Approve Treasury to spend USDT
        IERC20(usdt).approve(treasurySwap, usdtAmount);

        // 3. Buy Bond FOR the User
        ITreasurySwap(treasurySwap).buyFor(usdtAmount, msg.sender);
        
        emit NativeBondPurchase(msg.sender, msg.value, usdtAmount);
    }

    /// @notice Withdraw any stuck native tokens (admin only)
    function withdrawNative(address payable to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        emit NativeWithdrawn(to, amount);
    }

    /// @notice Withdraw any stuck ERC20 tokens (admin only)
    function withdrawToken(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).transfer(to, amount);
    }

    /// @notice Update treasury swap address (admin only)
    function setTreasurySwap(address _treasurySwap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasurySwap = _treasurySwap;
    }

    /// @notice Update router address (admin only)
    function setRouter(address _router) external onlyRole(DEFAULT_ADMIN_ROLE) {
        router = _router;
    }
    
    receive() external payable {}
}