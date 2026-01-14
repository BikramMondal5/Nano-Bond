
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    // Explicit addresses
    const bondAddr = "0x73835207b5DA114Fd1C22f650A2D8E1CFAc9a786"; // GOI-2030 Bond
    const newRegistryAddr = "0x216eB267d21096cec2Ad40B9CD8Ce576213AbEc"; // Config Registry

    console.log(`Bond: ${bondAddr}`);
    console.log(`New Registry Target: ${newRegistryAddr}`);
    console.log(`Admin/Signer: ${wallet.address}`);

    const BOND_ABI = [
        "function registry() view returns (address)",
        "function setRegistry(address) external",
        "function hasRole(bytes32 role, address account) view returns (bool)",
        "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
    ];

    const bond = new ethers.Contract(bondAddr, BOND_ABI, wallet);

    try {
        // 1. Check current Registry
        const currentReg = await bond.registry();
        console.log(`Current Registry: ${currentReg}`);

        if (currentReg.toLowerCase() === newRegistryAddr.toLowerCase()) {
            console.log("✅ Registry already matches!");
            return;
        }

        // 2. Check Admin Role
        const ADMIN_ROLE = await bond.DEFAULT_ADMIN_ROLE();
        const isAdmin = await bond.hasRole(ADMIN_ROLE, wallet.address);
        console.log(`Signer has ADMIN_ROLE: ${isAdmin}`);

        if (!isAdmin) {
            console.error("❌ CRITICAL: Signer is NOT Admin of this Bond. Cannot update Registry.");
            // Determine who is admin? events? difficult.
            return;
        }

        // 3. Set Registry
        console.log("Setting Registry...");
        const tx = await bond.setRegistry(newRegistryAddr);
        console.log(`TX Sent: ${tx.hash}`);
        await tx.wait();

        // 4. Verify
        const updatedReg = await bond.registry();
        console.log(`Updated Registry: ${updatedReg}`);

        if (updatedReg.toLowerCase() === newRegistryAddr.toLowerCase()) {
            console.log("✅ SUCCESS: Registry updated.");
        } else {
            console.log("❌ FAILURE: Registry did not change.");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
