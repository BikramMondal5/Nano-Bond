// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockUSDT.sol";

contract MockRouter {
    address public usdt;

    constructor(address _usdt) {
        usdt = _usdt;
    }

    /**
     * @dev Simulates a swap from ETH to USDT.
     *      Takes ETH, mints equivalent USDT to 'to'.
     *      (1 ETH = 2000 USDT roughly for logic, or 1:1 for simplicity)
     *      Let's say 1 Wei MNT = 1 Wei USDT for simple math.
     */
    function mockSwap(address to) external payable returns (uint256) {
        require(msg.value > 0, "No ETH sent");
        
        // Mint USDT to the recipient
        // We need MockUSDT cast
        MockUSDT(usdt).mint(to, msg.value);
        
        return msg.value;
    }
}
