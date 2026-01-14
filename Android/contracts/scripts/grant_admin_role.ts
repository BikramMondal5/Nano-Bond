import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Grant DEFAULT_ADMIN_ROLE on TreasurySwap to the backend Admin wallet.
 * Run with: npx hardhat run scripts/grant_admin_role.ts --network mantleSepolia
 */
async function main() {
    // Web Contracts Treasury
    const treasuryAddress = "0x60183a4f84c8102a91c6FFcd72142305eb4f95d2";
    const backendAdminWallet = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";

    const [deployer] = await ethers.getSigners();
    console.log("Executing with account:", deployer.address);

    const TREASURY_ABI = [
        "function grantRole(bytes32 role, address account) external",
        "function hasRole(bytes32 role, address account) external view returns (bool)",
        "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)"
    ];

    const treasury = new ethers.Contract(treasuryAddress, TREASURY_ABI, deployer);

    const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
    console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);

    const hasRole = await treasury.hasRole(DEFAULT_ADMIN_ROLE, backendAdminWallet);
    if (hasRole) {
        console.log(`✅ ${backendAdminWallet} already has DEFAULT_ADMIN_ROLE`);
        return;
    }

    console.log(`Granting DEFAULT_ADMIN_ROLE to ${backendAdminWallet}...`);
    const tx = await treasury.grantRole(DEFAULT_ADMIN_ROLE, backendAdminWallet);
    console.log("TX:", tx.hash);
    await tx.wait();
    console.log("✅ Role granted successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
