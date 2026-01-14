
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const bondAddr = "0x23B42EeFF25f003F4f5AcA16d67c2FD5dDf8e603"; // 'final bond hk'

    const ABI = [
        "function totalBackedValue() view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function assets(uint256) view returns (string, uint256, uint256)"
    ];

    const bond = new ethers.Contract(bondAddr, ABI, provider);

    try {
        const backed = await bond.totalBackedValue();
        const supply = await bond.totalSupply();

        console.log(`Bond: ${bondAddr}`);
        console.log(`Total Backed Value: ${backed.toString()}`);
        console.log(`Total Supply:       ${supply.toString()}`);

        if (backed == 0n) {
            console.log("\n⚠️ BOND HAS NO BACKING! Investment will fail.");
        }
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}

main();
