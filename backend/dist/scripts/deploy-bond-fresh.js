"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deployment_service_1 = require("../services/deployment.service");
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("Deploying FRESH contracts for GOI-2030...");
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        const service = new deployment_service_1.DeploymentService();
        const deployment = await service.deployBondProduct("GOI Bond 2030", "GOI-2030");
        console.log("✅ FRESH DEPLOYMENT COMPLETE:");
        console.log(`Bond:       ${deployment.contractAddress}`);
        console.log(`Treasury:   ${deployment.treasuryAddress}`);
        console.log(`Distributor: ${deployment.distributorAddress}`);
        // Update DB
        console.log("Updating MongoDB...");
        await Bond_1.Bond.updateOne({ bondId: 'GOI-2030' }, {
            $set: {
                contractAddress: deployment.contractAddress,
                treasuryAddress: deployment.treasuryAddress,
                distributorAddress: deployment.distributorAddress
            }
        });
        console.log("✅ MongoDB Updated.");
    }
    catch (e) {
        console.error("Error:", e.message);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
main();
