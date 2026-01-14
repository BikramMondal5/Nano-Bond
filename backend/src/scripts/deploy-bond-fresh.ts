
import { DeploymentService } from '../services/deployment.service';
import { Bond } from '../models/Bond';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function main() {
    console.log("Deploying FRESH contracts for GOI-2030...");

    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const service = new DeploymentService();
        const deployment = await service.deployBondProduct("GOI Bond 2030", "GOI-2030");

        console.log("✅ FRESH DEPLOYMENT COMPLETE:");
        console.log(`Bond:       ${deployment.contractAddress}`);
        console.log(`Treasury:   ${deployment.treasuryAddress}`);
        console.log(`Distributor: ${deployment.distributorAddress}`);

        // Update DB
        console.log("Updating MongoDB...");
        await Bond.updateOne(
            { bondId: 'GOI-2030' },
            {
                $set: {
                    contractAddress: deployment.contractAddress,
                    treasuryAddress: deployment.treasuryAddress,
                    distributorAddress: deployment.distributorAddress
                }
            }
        );
        console.log("✅ MongoDB Updated.");

    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

main();
