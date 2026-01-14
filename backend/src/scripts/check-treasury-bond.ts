
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);

    // The Treasury currently in DB
    const treasuryAddr = "0x0192dCAf9B8D52c204E92536c2A8f7fa17a4a0D3";
    console.log(`Checking Treasury: ${treasuryAddr}`);

    const TREASURY_ABI = [
        "function bond() view returns (address)",
        "function paymentToken() view returns (address)"
    ];

    const treasury = new ethers.Contract(treasuryAddr, TREASURY_ABI, provider);

    try {
        const bondAddr = await treasury.bond();
        console.log(`Treasury points to Bond: ${bondAddr}`);

        const paymentToken = await treasury.paymentToken();
        console.log(`Treasury points to USDT: ${paymentToken}`);

        // Now check THAT Bond's Registry
        const BOND_ABI = ["function registry() view returns (address)"];
        const bond = new ethers.Contract(bondAddr, BOND_ABI, provider);
        const registryAddr = await bond.registry();
        console.log(`Bond points to Registry: ${registryAddr}`);

        // Check if MATCHES config
        if (registryAddr.toLowerCase() !== config.contracts.registryAddress.toLowerCase()) {
            console.log("❌ REGISTRY MISMATCH!");
            console.log(`Config Registry: ${config.contracts.registryAddress}`);
            console.log("Run update-bond-registry.ts targeting THIS bond.");
        } else {
            console.log("✅ Registry Matches Config.");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
