
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const adminWallet = new ethers.Wallet(config.admin.privateKey!, provider);
    const TARGET_WALLET = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";

    console.log(`Admin Address: ${adminWallet.address}`);

    const USDT_ADDRESS = config.contracts.usdtAddress;
    const usdtContract = new ethers.Contract(USDT_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function mint(address, uint256) external",
        "function transfer(address, uint256) external"
    ], adminWallet);

    const balance = await usdtContract.balanceOf(adminWallet.address);
    console.log(`Admin USDT Balance: ${ethers.formatUnits(balance, 6)}`);

    console.log("Attempting to MINT to Target...");
    try {
        const tx = await usdtContract.mint(TARGET_WALLET, 10000n * 1000000n); // 10k USDT
        await tx.wait();
        console.log("✅ Minted 10,000 USDT to Target.");
    } catch (e: any) {
        console.error("Mint failed:", e.message);
        console.log("Attempting Transfer instead...");
        try {
            const tx2 = await usdtContract.transfer(TARGET_WALLET, 1000n * 1000000n);
            await tx2.wait();
            console.log("✅ Transferred 1,000 USDT to Target.");
        } catch (e2: any) {
            console.error("Transfer failed:", e2.message);
        }
    }
}

main();
