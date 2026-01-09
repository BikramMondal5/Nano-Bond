// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockUSDT is ERC20, ERC20Permit {
    constructor() ERC20("Mock USDC", "USDC") ERC20Permit("Mock USDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    // DEMO ONLY: Allow any signature to pass for testing "Gasless" flow without Frontend changes
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        // In Mainnet: Verify signature (super.permit)
        // In Demo: Just approve (simulate valid signature)
        _approve(owner, spender, value);
    }
}
