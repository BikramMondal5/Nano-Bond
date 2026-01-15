import { ethers } from 'ethers';
import { config } from '../src/config';

async function main() {
    const userAddress = '0xafa03dac869311419ab8d2c60c7a3e4f3ddd044e';
    const amount = 1000; // 1000 USDT

    console.log(`Minting ${amount} USDT to ${userAddress}...`);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const adminWallet = new ethers.Wallet(config.admin.privateKey, provider);

    const USDT_ABI = [
        "function mint(address to, uint256 amount) external",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, adminWallet);

    const tx = await usdt.mint(userAddress, BigInt(amount * 1000000));
    console.log(`Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log('Confirmed!');

    const balance = await usdt.balanceOf(userAddress);
    console.log(`New Balance: ${ethers.formatUnits(balance, 6)} USDT`);
}

main().catch(console.error);
