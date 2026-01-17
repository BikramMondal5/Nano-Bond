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
const Bond_1 = require("../models/Bond");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    console.log("Checking Bond Final Details...");
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing!");
        process.exit(1);
    }
    const uri = process.env.MONGODB_URI;
    try {
        await mongoose_1.default.connect(uri);
        const bondId = 'GOI-2030';
        const bond = await Bond_1.Bond.findOne({ bondId });
        if (bond) {
            console.log("Bond ID:", bond.bondId);
            console.log("Treasury Address (in DB):", bond.treasuryAddress);
            console.log("Bond Contract Address (in DB):", bond.contractAddress);
            const expectedTreasury = "0x0192dCAf9B8D52c204E92536c2A8f7fa17a4a0D3";
            const expectedBond = "0x73835207b5DA114Fd1C22f650A2D8E1CFAc9a786";
            if (bond.treasuryAddress === expectedTreasury && bond.contractAddress === expectedBond) {
                console.log("✅ DB Data Matches Expected Deployment.");
            }
            else {
                console.log("❌ DB Data MISMATCH!");
                console.log(`Expected Treasury: ${expectedTreasury}`);
                console.log(`Got: ${bond.treasuryAddress}`);
            }
        }
        else {
            console.log("Bond not found");
        }
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
main();
