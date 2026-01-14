
import { ethers } from 'ethers';
import { config } from '../config';

async function main() {
    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const wallet = new ethers.Wallet(config.admin.privateKey, provider);

    const bondAddress = config.contracts.bondAddress;
    const configRegistry = config.contracts.registryAddress;

    console.log(`Bond: ${bondAddress}`);
    console.log(`Setting Registry to: ${configRegistry}`);

    const bond = new ethers.Contract(bondAddress, ["function setRegistry(address) external"], wallet);

    try {
        const tx = await bond.setRegistry(configRegistry);
        console.log(`TX Sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Registry Updated Successfully!");
    } catch (e: any) {
        console.error("Update failed:", e.message);
    }
}

main();
