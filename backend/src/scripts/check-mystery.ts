
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const TARGET_ADDR = "0x9e4c32d3f1e06cc56177438e46A478575462cb0b"; // The address from error logs
    console.log(`Checking Mystery Distributor: ${TARGET_ADDR}`);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);

    // Check Configured USDT
    const distContract = new ethers.Contract(TARGET_ADDR, [
        "function paymentToken() view returns (address)",
        "function reserve() view returns (uint256)",
        "function cumulativeYieldPerToken() view returns (uint256)"
    ], provider);

    try {
        const paymentToken = await distContract.paymentToken();
        console.log(`Payment Token: ${paymentToken}`);

        const reserve = await distContract.reserve();
        console.log(`Internal Reserve: ${ethers.formatUnits(reserve, 6)}`);

        // Check Balance of this contract on the Payment Token
        const usdtContract = new ethers.Contract(paymentToken, ["function balanceOf(address) view returns (uint256)"], provider);
        const balance = await usdtContract.balanceOf(TARGET_ADDR);
        console.log(`Actual Balance: ${ethers.formatUnits(balance, 6)}`);

        const cumYield = await distContract.cumulativeYieldPerToken();
        console.log(`Cumulative Yield: ${ethers.formatUnits(cumYield, 6)}`);

    } catch (e: any) {
        console.error("Read Error:", e.message);
    }
}

main();
