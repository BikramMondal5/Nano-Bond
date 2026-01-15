const { ethers } = require('ethers');
require('dotenv').config();

const config = {
    rpc: process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    bondAddress: process.env.SOVEREIGN_BOND_ADDRESS,
    newRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS,
    privateKey: process.env.PRIVATE_KEY
};

async function update() {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    console.log('Admin:', wallet.address);
    console.log('Target Bond:', config.bondAddress);
    console.log('Setting New Registry:', config.newRegistryAddress);

    const bond = new ethers.Contract(config.bondAddress, [
        "function setRegistry(address _registry) external",
        "function registry() view returns (address)"
    ], wallet);

    const currentRegistry = await bond.registry();
    console.log('Current Registry:', currentRegistry);

    if (currentRegistry.toLowerCase() === config.newRegistryAddress.toLowerCase()) {
        console.log('Already updated!');
        return;
    }

    console.log('Updating...');
    const tx = await bond.setRegistry(config.newRegistryAddress);
    console.log('Tx sent:', tx.hash);
    await tx.wait();
    console.log('Success! Registry updated.');
}

update().catch(console.error);
