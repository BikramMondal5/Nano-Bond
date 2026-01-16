import { BondService } from '../src/services/bond.service';
import { performance } from 'perf_hooks';

async function main() {
    console.log('Starting Performance Verification...');
    // convert uri to generic string to avoid leaking secrets in logs if possible, or just log length
    const { config } = require('../src/config');
    console.log(`Mongo URI present: ${!!config.mongodb.uri}`);

    const bondService = new BondService();

    // Wait for DB connection
    console.log('Waiting for DB connection...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Warm-up / First Run (Uncached)
    console.log('\n--- Run 1: Cold Start (Uncached) ---');
    let start = performance.now();
    const bonds1 = await bondService.listBonds();
    let end = performance.now();
    console.log(`Fetched ${bonds1.length} bonds in ${(end - start).toFixed(2)}ms`);

    // Second Run (Cached)
    console.log('\n--- Run 2: Hot Cache (Cached) ---');
    start = performance.now();
    const bonds2 = await bondService.listBonds();
    end = performance.now();
    console.log(`Fetched ${bonds2.length} bonds in ${(end - start).toFixed(2)}ms`);

    // Verification
    if (bonds1.length !== bonds2.length) {
        console.error('ERROR: Bond count mismatch!');
        process.exit(1);
    }

    // Check Portfolio Logic (Mock Address)
    console.log('\n--- Checking Portfolio Logic ---');
    const mockAddress = '0x000000000000000000000000000000000000dead';
    start = performance.now();
    const portfolio = await bondService.getPortfolio(mockAddress);
    end = performance.now();
    console.log(`Fetched portfolio in ${(end - start).toFixed(2)}ms`);

    console.log('\nVerification Complete!');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
