
import * as dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    const TARGET = "0x7628bcf891eCd0112EaA2fd23c14aFB583813777"; // Bond 7777785 Distributor
    const ADMIN_WALLET = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";

    console.log(`Checking Support on: ${TARGET}`);
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey!, provider);

    // 1. Native Balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Admin Native Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        console.warn("⚠️ CRITICAL: Admin has 0 ETH! Cannot send transactions.");
        return; // Cannot check further if no gas
    }

    // 2. Check adminClaim
    const distContract = new ethers.Contract(TARGET, [
        "function adminClaim(address) external",
        "function hasRole(bytes32, address) view returns (bool)"
    ], wallet);

    console.log("Simulating adminClaim...");
    try {
        // We use callStatic to simulate w/o spending gas OR just rely on error details
        await distContract.adminClaim.staticCall(ADMIN_WALLET);
        console.log("✅ adminClaim Supported and Succeeded (Dry Run)");
    } catch (e: any) {
        console.error("❌ adminClaim Failed/Missing:", e.shortMessage || e.message);
        if (e.message.includes("Unrecognized selector") || e.data === "0x") {
            console.log("-> IMPLICATION: Contract is OLD and missing 'adminClaim'. Needs Repair.");
        }
    }
}

main();
