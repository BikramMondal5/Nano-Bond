// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OAppSender.sol";
import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OAppReceiver.sol";

interface ITreasury {
    function buyFor(uint256 amount, address beneficiary) external;
}

/**
 * @title CrossChainInvestmentGateway
 * @notice Enables cross-chain USDT investments via LayerZero V2
 * @dev Deployed on both source chains (Ethereum, BSC, etc.) and destination (Mantle)
 */
contract CrossChainInvestmentGateway is OApp {
    using SafeERC20 for IERC20;

    IERC20 public usdt;
    address public treasury; // Only used on Mantle (destination)

    // Track pending investments for refunds
    mapping(bytes32 => PendingInvestment) public pendingInvestments;

    struct PendingInvestment {
        address investor;
        uint256 amount;
        uint32 srcEid;
        bool processed;
    }

    event CrossChainInvestmentSent(
        address indexed investor,
        uint256 amount,
        uint32 dstEid,
        bytes32 guid
    );

    event CrossChainInvestmentReceived(
        address indexed investor,
        uint256 amount,
        uint32 srcEid,
        bytes32 guid
    );

    event InvestmentFailed(bytes32 indexed guid, string reason);

    constructor(
        address _endpoint,
        address _usdt,
        address _treasury,
        address _owner
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        usdt = IERC20(_usdt);
        treasury = _treasury;
    }

    /**
     * @notice Send USDT cross-chain for bond investment
     * @param amount Amount of USDT to invest (6 decimals)
     * @param dstEid Destination endpoint ID (Mantle Sepolia)
     * @param extraOptions LayerZero options for gas
     */
    function investCrossChain(
        uint256 amount,
        uint32 dstEid,
        bytes calldata extraOptions
    ) external payable returns (bytes32 guid) {
        require(amount > 0, "Amount must be > 0");

        // Pull USDT from user
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        // Encode the message: investor address + amount
        bytes memory payload = abi.encode(msg.sender, amount);

        // Build message options
        bytes memory options = extraOptions.length > 0
            ? extraOptions
            : _buildDefaultOptions(dstEid);

        // Send via LayerZero
        MessagingReceipt memory receipt = _lzSend(
            dstEid,
            payload,
            options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        guid = receipt.guid;

        // Store pending investment
        pendingInvestments[guid] = PendingInvestment({
            investor: msg.sender,
            amount: amount,
            srcEid: dstEid,
            processed: false
        });

        emit CrossChainInvestmentSent(msg.sender, amount, dstEid, guid);

        return guid;
    }

    /**
     * @notice Send USDT cross-chain for bond investment on behalf of a beneficiary
     * @dev Used for gasless investments where admin sponsors the transaction
     * @param beneficiary Address that will receive the bonds
     * @param amount Amount of USDT to invest (6 decimals)
     * @param dstEid Destination endpoint ID (Mantle Sepolia)
     * @param extraOptions LayerZero options for gas
     */
    function investCrossChainFor(
        address beneficiary,
        uint256 amount,
        uint32 dstEid,
        bytes calldata extraOptions
    ) external payable returns (bytes32 guid) {
        require(amount > 0, "Amount must be > 0");
        require(beneficiary != address(0), "Invalid beneficiary");

        // Pull USDT from caller (admin wallet)
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        // Encode the message: beneficiary address + amount
        bytes memory payload = abi.encode(beneficiary, amount);

        // Build message options
        bytes memory options = extraOptions.length > 0
            ? extraOptions
            : _buildDefaultOptions(dstEid);

        // Send via LayerZero
        MessagingReceipt memory receipt = _lzSend(
            dstEid,
            payload,
            options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        guid = receipt.guid;

        // Store pending investment with beneficiary as investor
        pendingInvestments[guid] = PendingInvestment({
            investor: beneficiary,
            amount: amount,
            srcEid: dstEid,
            processed: false
        });

        emit CrossChainInvestmentSent(beneficiary, amount, dstEid, guid);

        return guid;
    }

    /**
     * @notice Receive cross-chain message and execute investment
     * @dev Called by LayerZero endpoint on destination chain
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _payload,
        address, // _executor
        bytes calldata // _extraData
    ) internal virtual override {
        (address investor, uint256 amount) = abi.decode(
            _payload,
            (address, uint256)
        );

        try this.executeInvestment(investor, amount, _origin.srcEid, _guid) {
            emit CrossChainInvestmentReceived(
                investor,
                amount,
                _origin.srcEid,
                _guid
            );
        } catch Error(string memory reason) {
            emit InvestmentFailed(_guid, reason);
            // On failure, tokens stay in contract for manual recovery
        }
    }

    /**
     * @notice Execute the actual investment on Mantle
     * @dev Separated for try-catch error handling
     */
    function executeInvestment(
        address investor,
        uint256 amount,
        uint32 srcEid,
        bytes32 guid
    ) external {
        require(msg.sender == address(this), "Only self");
        require(treasury != address(0), "Treasury not set");

        // Approve treasury to spend USDT
        usdt.approve(treasury, amount);

        // Execute investment
        ITreasury(treasury).buyFor(amount, investor);

        // Mark as processed
        if (pendingInvestments[guid].investor != address(0)) {
            pendingInvestments[guid].processed = true;
        }
    }

    /**
     * @notice Quote cross-chain investment fee
     */
    function quoteCrossChainFee(
        uint32 dstEid,
        uint256 amount,
        bytes calldata extraOptions
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory payload = abi.encode(msg.sender, amount);
        bytes memory options = extraOptions.length > 0
            ? extraOptions
            : _buildDefaultOptions(dstEid);

        MessagingFee memory fee = _quote(dstEid, payload, options, false);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    /**
     * @notice Build default LayerZero options
     */
    function _buildDefaultOptions(
        uint32 dstEid
    ) internal pure returns (bytes memory) {
        // Gas limit for destination execution (adjust based on your needs)
        uint128 gasLimit = 200000;
        return abi.encodePacked(uint16(1), gasLimit);
    }

    /**
     * @notice Update treasury address (Mantle only)
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    /**
     * @notice Rescue tokens in case of failed transfers
     */
    function rescueTokens(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Withdraw native token (for LayerZero fees refund)
     */
    function withdrawNative(
        address payable to,
        uint256 amount
    ) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
