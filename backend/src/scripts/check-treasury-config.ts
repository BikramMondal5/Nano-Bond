
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);

    // Configured Addresses
    const treasuryAddr = config.contracts.treasuryAddress;
    const usdtAddr = config.contracts.usdtAddress; // The correct one (0xF62f...)

    console.log(`Config Treasury: ${treasuryAddr}`);
    console.log(`Config USDT:     ${usdtAddr}`);

    // The suspect address from the error
    const suspectAddr = "0xf013e47ad7d8e0edbb8e9d2a7d7c73a23af88a11";
    console.log(`Suspect Spender: ${suspectAddr}`);

    if (treasuryAddr.toLowerCase() === suspectAddr.toLowerCase()) {
        console.log("✅ Suspect IS the Configured Treasury.");
    } else {
        console.log("⚠️ Suspect DOES NOT match Config Treasury!");
        // We will inspect the suspect address anyway, assuming it might be the actual deployed one used by the frontend?
        // Or maybe backend config is wrong?
    }

    const TREASURY_ABI = [
        "function paymentToken() view returns (address)",
        "function bond() view returns (address)"
    ];

    const targetTreasury = treasuryAddr || suspectAddr;
    const treasury = new ethers.Contract(targetTreasury, TREASURY_ABI, provider);

    try {
        const paymentToken = await treasury.paymentToken();
        console.log(`[On-Chain] Treasury.paymentToken(): ${paymentToken}`);

        if (paymentToken.toLowerCase() !== usdtAddr.toLowerCase()) {
            console.log("❌ MISMATCH: Treasury is using WRONG USDT!");
            console.log("Reason: Gateway approves NewUSDT, Treasury tries to pull OldUSDT.");
        } else {
            console.log("✅ Treasury is using Correct USDT.");
        }

    } catch (e: any) {
        console.error("Error reading Treasury:", e.message);
    }
}

main();
