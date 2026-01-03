import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Verifying identity for:", signer.address);

    // Load addresses
    const addressesPath = path.join(__dirname, "../deployed_addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    const registry = IdentityRegistry.attach(addresses.Registry);

    // Check if already verified
    const isVerified = await registry.isVerified(signer.address);
    if (isVerified) {
        console.log("User is already verified.");
        return;
    }

    // Register
    // Generate a dummy hash for "National ID"
    const dummyIdHash = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ID_" + Date.now()));

    console.log("Registering with ID Hash:", dummyIdHash);

    const tx = await registry.register(signer.address, dummyIdHash);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("Identity Verified Successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
