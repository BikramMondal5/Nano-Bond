const { ethers } = require('ethers');
require('dotenv').config();

const config = {
    rpc: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    bondAddress: process.env.SOVEREIGN_BOND_ADDRESS,
    registryAddress: process.env.IDENTITY_REGISTRY_ADDRESS,
    userAddress: '0xd0a5670142195ae1c57283f57f2244860dbe4aea' // From user log
};

console.log('--- Configured Addresses ---');
console.log('Bond:', config.bondAddress);
console.log('Registry (Env):', config.registryAddress);
console.log('User:', config.userAddress);

async function check() {
    const provider = new ethers.JsonRpcProvider(config.rpc);

    // Check Bond's Registry
    const bond = new ethers.Contract(config.bondAddress, [
        "function registry() view returns (address)",
        "function assets(uint256) view returns (string, uint256, uint256)"
    ], provider);

    const bondRegistry = await bond.registry();
    console.log('\n--- On-Chain Data ---');
    console.log('BondContract.registry():', bondRegistry);

    if (bondRegistry.toLowerCase() !== config.registryAddress.toLowerCase()) {
        console.error('MISMATCH Detected! Bond is using a different Registry.');
    } else {
        console.log('Match! Bond is using the configured Registry.');
    }

    // Check Verification Status on BOTH
    const registryAbi = ["function isVerified(address) view returns (bool)"];

    // 1. Env Registry
    const envRegistry = new ethers.Contract(config.registryAddress, registryAbi, provider);
    const isVerifiedEnv = await envRegistry.isVerified(config.userAddress);
    console.log(`\nIs Verified on Env Registry (${config.registryAddress})?`, isVerifiedEnv);

    // 2. Bond's Actual Registry
    const actualRegistry = new ethers.Contract(bondRegistry, registryAbi, provider);
    const isVerifiedActual = await actualRegistry.isVerified(config.userAddress);
    console.log(`Is Verified on Bond's Registry (${bondRegistry})?`, isVerifiedActual);
}

check().catch(console.error);
