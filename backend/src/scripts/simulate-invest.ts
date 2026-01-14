
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    console.log("Simulating Investment Transaction...");
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    // Params
    const userAddress = "0x68C247C1aD1AAdC4786c853590bC8A5bd67B3e9d";
    const amount = ethers.parseUnits("500", 6); // 500 USDT

    // Addresses
    const gatewayAddr = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB";
    const treasuryAddr = "0x0192dCAf9B8D52c204E92536c2A8f7fa17a4a0D3"; // Correct Treasury

    console.log(`Gateway: ${gatewayAddr}`);
    console.log(`Treasury: ${treasuryAddr}`);
    console.log(`User: ${userAddress}`);
    console.log(`Amount: ${ethers.formatUnits(amount, 6)} USDT`);

    // Check Balance
    const usdtAddr = config.contracts.usdtAddress;
    const usdt = new ethers.Contract(usdtAddr, ["function balanceOf(address) view returns (uint256)"], provider);
    const balance = await usdt.balanceOf(userAddress);
    console.log(`User Balance: ${ethers.formatUnits(balance, 6)} USDT`);

    if (balance < amount) {
        console.error("❌ INSUFFICIENT BALANCE! User needs to use Faucet first.");
        return;
    }

    const GATEWAY_ABI = [
        "function investWithPermit(address user, uint256 amount, address treasury, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
    ];
    const gateway = new ethers.Contract(gatewayAddr, GATEWAY_ABI, wallet);

    // Dummy Permit
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const v = 27;
    const r = ethers.ZeroHash;
    const s = ethers.ZeroHash;

    try {
        console.log("Sending Transaction...");
        // Use staticCall first to see revert reason
        await gateway.investWithPermit.staticCall(userAddress, amount, treasuryAddr, deadline, v, r, s);
        console.log("✅ Simulation Passed! Transaction should succeed.");

        // If simulation passes, send it? No, just debug.
    } catch (error: any) {
        console.log("❌ Simulation FAILED!");
        if (error.data) {
            console.log(`Revert Data: ${error.data}`);
            // try decoding
            try {
                // Decode common errors
                const iface = new ethers.Interface([
                    "error ERC20InsufficientAllowance(address spender, uint256 current, uint256 needed)",
                    "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
                    "error NotVerified(address user)",
                    "error OwnableUnauthorizedAccount(address account)"
                ]);
                const decoded = iface.parseError(error.data);
                console.log(`Decoded Error: ${decoded?.name}`);
                console.log(`Args: ${decoded?.args}`);
            } catch (decodeErr) {
                console.log("Could not decode error data.");
            }
        } else {
            console.log("Error Message:", error.message);
        }
    }
}

main();
