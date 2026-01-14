
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const TARGET_USER = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    const DISTRIBUTOR = "0x7628bcf891eCd0112EaA2fd23c14aFB583813777"; // 7777785 Distributor

    console.log(`Checking Distributor: ${DISTRIBUTOR}`);
    const provider = new ethers.JsonRpcProvider(config.rpc.url);

    // Check Roles & Yield
    const distContract = new ethers.Contract(DISTRIBUTOR, [
        "function hasRole(bytes32, address) view returns (bool)",
        "function claimableYield(address) view returns (uint256)",
        "function reserve() view returns (uint256)"
    ], provider);

    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const hasAdmin = await distContract.hasRole(DEFAULT_ADMIN_ROLE, TARGET_USER);
    console.log(`User is Admin? ${hasAdmin}`);

    const claimable = await distContract.claimableYield(TARGET_USER);
    console.log(`Claimable Yield: ${ethers.formatUnits(claimable, 6)} USDT`);

    const reserve = await distContract.reserve();
    console.log(`Reserve: ${ethers.formatUnits(reserve, 6)} USDT`);
}

main();
