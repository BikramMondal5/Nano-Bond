import { ethers } from "hardhat";

async function main() {
    const BOND_ADDRESS = ethers.getAddress("0x1cF3b6B2C10982b81C40d9F73c25f9d1678eddf8");
    // User Address (from previous logs)
    const USER_ADDRESS = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";

    console.log("Checking User Balance...");
    console.log("Bond:", BOND_ADDRESS);
    console.log("User:", USER_ADDRESS);

    const bond = await ethers.getContractAt("SovereignBond", BOND_ADDRESS);
    const balance = await bond.balanceOf(USER_ADDRESS);

    console.log("-----------------------------------------");
    console.log("Raw Balance (Wei):", balance.toString());
    console.log("Decimals: 18");
    console.log("Formatted (18 dec):", ethers.formatUnits(balance, 18));
    console.log("Formatted (6 dec): ", ethers.formatUnits(balance, 6));
    console.log("-----------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
