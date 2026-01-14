
import { ethers } from 'ethers';
import { config } from '../src/config';

const IDENTITY_REGISTRY_V2_ABI = [
    "function isVerified(address wallet) external view returns (bool)",
    "function identities(address) external view returns (bytes32, uint256, uint256, bool, uint8)"
];

async function check() {
    const address = '0xafa03dac869311419ab8d2c60c7a3e4f3ddd044e';
    const contractAddress = config.contracts.registryAddress;

    console.log('Checking KYC status for:', address);
    console.log('Registry Address:', contractAddress);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const registry = new ethers.Contract(contractAddress, IDENTITY_REGISTRY_V2_ABI, provider);

    try {
        const isVerified = await registry.isVerified(address);
        console.log('V2 KYC Verification Status:', isVerified);

        // Check USDT Balance
        const USDT_ABI = ["function balanceOf(address) view returns (uint256)"];
        const usdt = new ethers.Contract(config.contracts.usdtAddress, USDT_ABI, provider);
        const balance = await usdt.balanceOf(address);
        console.log('USDT Balance:', ethers.formatUnits(balance, 6));

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
