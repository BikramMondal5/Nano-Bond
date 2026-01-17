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
const config_1 = require("../config");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Force load .env again to see what is on disk
const envPath = path_1.default.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });
const CORRECT_USDT = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
const CORRECT_GATEWAY = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB";
const CORRECT_REGISTRY = "0x216eB267d21096cec82Ad40B9CD8Ce576213AbEc";
console.log("=== ENV INTEGRITY CHECK ===");
console.log(`Loaded .env path: ${envPath}`);
if (result.error)
    console.log("⚠️ dotenv load error:", result.error);
console.log("\n[Expected vs Configured]");
console.log(`USDT:     ${CORRECT_USDT} vs ${config_1.config.contracts.usdtAddress} ${CORRECT_USDT.toLowerCase() === config_1.config.contracts.usdtAddress?.toLowerCase() ? '✅' : '❌'}`);
console.log(`Gateway:  ${CORRECT_GATEWAY} vs ${config_1.config.contracts.gatewayAddress} ${CORRECT_GATEWAY.toLowerCase() === config_1.config.contracts.gatewayAddress?.toLowerCase() ? '✅' : '❌'}`);
console.log(`Registry: ${CORRECT_REGISTRY} vs ${config_1.config.contracts.registryAddress} ${CORRECT_REGISTRY.toLowerCase() === config_1.config.contracts.registryAddress?.toLowerCase() ? '✅' : '❌'}`);
console.log("\n[Raw .env File Content Matches?]");
const rawEnv = result.parsed || {};
console.log(`USDT in .env:     ${rawEnv.USDT_ADDRESS || '(missing)'}`);
console.log(`Gateway in .env:  ${rawEnv.SWAP_GATEWAY_ADDRESS || '(missing)'}`);
console.log(`Registry in .env: ${rawEnv.IDENTITY_REGISTRY_ADDRESS || '(missing)'}`);
if (CORRECT_USDT.toLowerCase() === config_1.config.contracts.usdtAddress?.toLowerCase() &&
    CORRECT_GATEWAY.toLowerCase() === config_1.config.contracts.gatewayAddress?.toLowerCase() &&
    CORRECT_REGISTRY.toLowerCase() === config_1.config.contracts.registryAddress?.toLowerCase()) {
    console.log("\n✅ PASSED: Your environment variables are PERFECTLY UPDATED.");
}
else {
    console.log("\n❌ FAILED: Some environment variables are OUTDATED.");
}
