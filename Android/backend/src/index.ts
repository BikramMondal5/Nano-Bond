import { ethers } from 'ethers';
import { config } from './config';

async function main() {
    console.log(`
    =============================================
       SOVEREIGN BOND BACKEND SERVICES
    =============================================
    1. Transparency Portal (Debt Monitor)
       Command: npm run monitor
       
    2. Yield Automation Bot (Coupon Distributor)
       Command: npm run bot
    =============================================
    `);

    // Run Monitor once as default "Status Check"
    console.log("Running Status Check...");
    const { execSync } = require('child_process');
    try {
        console.log(execSync('npx ts-node src/debt-monitor.ts').toString());
    } catch (e: any) {
        console.error("Status Check Failed:", e.message);
    }
}

main().catch(console.error);
