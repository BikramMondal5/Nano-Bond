"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const config_1 = require("./config");
const BOND_ABI = [
    "function addAsset(string memory uri, uint256 value) external",
    "function totalBackedValue() external view returns (uint256)",
    "function totalSupply() external view returns (uint256)"
];
async function main() {
    console.log('Adding Initial Asset Backing...');
    if (!config_1.config.admin.privateKey) {
        throw new Error('Admin private key not found in .env');
    }
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    const adminWallet = new ethers_1.ethers.Wallet(config_1.config.admin.privateKey, provider);
    const bondAddress = config_1.config.contracts.bondAddress;
    console.log('Contract:', bondAddress);
    console.log('Admin:', adminWallet.address);
    const bond = new ethers_1.ethers.Contract(bondAddress, BOND_ABI, adminWallet);
    // Check current status
    const currentBacked = await bond.totalBackedValue();
    const currentSupply = await bond.totalSupply();
    console.log(`Current Supply: ${ethers_1.ethers.formatUnits(currentSupply, 18)} GBOND`);
    console.log(`Current Backing: ${ethers_1.ethers.formatUnits(currentBacked, 18)} GBOND Equivalent`);
    // Add 10 Million GBOND worth of backing (10,000,000 * 10^18)
    const assetValue = ethers_1.ethers.parseUnits("10000000", 18);
    const assetUri = "https://rbi.org.in/assets/gold-reserves-proof-2024.pdf";
    console.log(`Adding Asset: ${ethers_1.ethers.formatUnits(assetValue, 18)}...`);
    try {
        const tx = await bond.addAsset(assetUri, assetValue);
        console.log('Tx sent:', tx.hash);
        await tx.wait();
        console.log('Asset added successfully!');
        const newBacked = await bond.totalBackedValue();
        console.log(`New Backing: ${ethers_1.ethers.formatUnits(newBacked, 18)} GBOND Equivalent`);
    }
    catch (error) {
        console.error('Failed to add asset:', error.message);
        if (error.data) {
            console.error('Error Data:', error.data);
        }
    }
}
main().catch(console.error);
