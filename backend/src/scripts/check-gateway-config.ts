
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const GATEWAY_ABI = ["function usdc() view returns (address)"];

    // Configured Gateway Address
    const gatewayAddr = config.contracts.gatewayAddress;

    try {
        const gateway = new ethers.Contract(gatewayAddr, GATEWAY_ABI, provider);
        const usdcOnChain = await gateway.usdc();

        console.log("GATEWAY_ADDR=" + gatewayAddr);
        console.log("GATEWAY_USDC_ONCHAIN=" + usdcOnChain);
        console.log("CONFIG_USDT_ADDR=" + config.contracts.usdtAddress);

        if (usdcOnChain.toLowerCase() !== config.contracts.usdtAddress.toLowerCase()) {
            console.log("MISMATCH_DETECTED");
        } else {
            console.log("MATCH_CONFIRMED");
        }
    } catch (e) {
        console.log("ERROR=" + e.message);
    }
}

main();
