
import { config } from '../config';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load .env again to see what is on disk
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

const CORRECT_USDT = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
const CORRECT_GATEWAY = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB";
const CORRECT_REGISTRY = "0x216eB267d21096cec82Ad40B9CD8Ce576213AbEc";

console.log("=== ENV INTEGRITY CHECK ===");
console.log(`Loaded .env path: ${envPath}`);
if (result.error) console.log("⚠️ dotenv load error:", result.error);

console.log("\n[Expected vs Configured]");
console.log(`USDT:     ${CORRECT_USDT} vs ${config.contracts.usdtAddress} ${CORRECT_USDT.toLowerCase() === config.contracts.usdtAddress?.toLowerCase() ? '✅' : '❌'}`);
console.log(`Gateway:  ${CORRECT_GATEWAY} vs ${config.contracts.gatewayAddress} ${CORRECT_GATEWAY.toLowerCase() === config.contracts.gatewayAddress?.toLowerCase() ? '✅' : '❌'}`);
console.log(`Registry: ${CORRECT_REGISTRY} vs ${config.contracts.registryAddress} ${CORRECT_REGISTRY.toLowerCase() === config.contracts.registryAddress?.toLowerCase() ? '✅' : '❌'}`);

console.log("\n[Raw .env File Content Matches?]");
const rawEnv = result.parsed || {};
console.log(`USDT in .env:     ${rawEnv.USDT_ADDRESS || '(missing)'}`);
console.log(`Gateway in .env:  ${rawEnv.SWAP_GATEWAY_ADDRESS || '(missing)'}`);
console.log(`Registry in .env: ${rawEnv.IDENTITY_REGISTRY_ADDRESS || '(missing)'}`);

if (
    CORRECT_USDT.toLowerCase() === config.contracts.usdtAddress?.toLowerCase() &&
    CORRECT_GATEWAY.toLowerCase() === config.contracts.gatewayAddress?.toLowerCase() &&
    CORRECT_REGISTRY.toLowerCase() === config.contracts.registryAddress?.toLowerCase()
) {
    console.log("\n✅ PASSED: Your environment variables are PERFECTLY UPDATED.");
} else {
    console.log("\n❌ FAILED: Some environment variables are OUTDATED.");
}
