import { ethers } from "hardhat";

const TREASURY_ADDR = "0xAe201ee42d2A3a786a9e6670d5599e3cB7Dc2f63";
const BOND_ADDR = "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02";

async function main() {
    console.log("Verifying address:", TREASURY_ADDR);
    const TreasurySwap = await ethers.getContractFactory("TreasurySwap");
    const treasury = TreasurySwap.attach(TREASURY_ADDR);

    const bond = await treasury.bond();
    console.log("Treasury Bond Address:", bond);

    if (bond === BOND_ADDR) {
        console.log("VERIFICATION SUCCESS: Address match!");
    } else {
        console.error("VERIFICATION FAILED: Mismatch!");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
