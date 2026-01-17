
import { ethers } from 'ethers';
import { config } from '../config';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    const bondAddress = "0xb31e1c4f5849060f0aadb315d4edc982886c4f90"; // User's broken bond
    const userAddress = "0x3cfd863a8713db5efeb7a8dd41c94a4d7b5729b8"; // User's wallet

    console.log(`Fixing admin role for Bond ${bondAddress}...`);
    console.log(`Granting role to ${userAddress}...`);

    if (!config.admin.privateKey) {
        throw new Error("Admin private key not found in config");
    }

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    const checkCode = await provider.getCode(bondAddress);
    if (checkCode === "0x") {
        console.error("Contract not found at this address!");
        return;
    }

    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const bondContract = new ethers.Contract(
        bondAddress,
        ["function grantRole(bytes32, address) external", "function hasRole(bytes32, address) view returns (bool)"],
        wallet
    );

    const hasRole = await bondContract.hasRole(DEFAULT_ADMIN_ROLE, userAddress);
    if (hasRole) {
        console.log("User already has admin role.");
        return;
    }

    try {
        const tx = await bondContract.grantRole(DEFAULT_ADMIN_ROLE, userAddress);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("Success! Administrator role granted.");
    } catch (error) {
        console.error("Failed to grant role:", error);
    }
}

main().catch(console.error);
