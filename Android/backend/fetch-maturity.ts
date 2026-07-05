// Script to fetch maturity date from blockchain for a specific bond
import { ethers } from 'ethers';
import { config } from './src/config';
import { BondService } from './src/services/bond.service';

const BOND_ABI = [
    "function maturityDate() external view returns (uint256)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)"
];

async function fetchMaturityDate(bondId: string) {
    console.log(`\n=== Fetching Maturity Date for Bond: ${bondId} ===\n`);

    const provider = new ethers.JsonRpcProvider(config.rpc.url);
    const bondService = new BondService();

    // Wait for MongoDB connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get bond info from registry
    const bond = await bondService.getBondById(bondId);

    if (!bond) {
        console.error(`Bond ${bondId} not found in registry!`);
        process.exit(1);
    }

    console.log(`Bond Name: ${bond.bondName}`);
    console.log(`Contract Address: ${bond.contractAddress}`);

    // Query blockchain
    const contract = new ethers.Contract(bond.contractAddress, BOND_ABI, provider);

    try {
        const [maturityTimestamp, name, symbol] = await Promise.all([
            contract.maturityDate(),
            contract.name(),
            contract.symbol()
        ]);

        const maturityDate = new Date(Number(maturityTimestamp) * 1000);
        const now = new Date();
        const isMatured = now >= maturityDate;

        console.log(`\n--- On-Chain Data ---`);
        console.log(`Contract Name: ${name}`);
        console.log(`Contract Symbol: ${symbol}`);
        console.log(`Maturity Timestamp: ${maturityTimestamp.toString()}`);
        console.log(`Maturity Date: ${maturityDate.toISOString()}`);
        console.log(`Maturity Date (Readable): ${maturityDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`);
        console.log(`Is Matured: ${isMatured ? 'YES ✅' : 'NO 🔒'}`);
        console.log(`Current Time: ${now.toISOString()}`);

    } catch (error: any) {
        console.error(`Failed to fetch from blockchain:`, error.message);
    }

    process.exit(0);
}

// Get bondId from command line args or default to 522677 (gg4)
const bondId = process.argv[2] || '522677';
fetchMaturityDate(bondId);
