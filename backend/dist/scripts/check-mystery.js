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
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
async function main() {
    const TARGET_ADDR = "0x9e4c32d3f1e06cc56177438e46A478575462cb0b"; // The address from error logs
    console.log(`Checking Mystery Distributor: ${TARGET_ADDR}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    // Check Configured USDT
    const distContract = new ethers_1.ethers.Contract(TARGET_ADDR, [
        "function paymentToken() view returns (address)",
        "function reserve() view returns (uint256)",
        "function cumulativeYieldPerToken() view returns (uint256)"
    ], provider);
    try {
        const paymentToken = await distContract.paymentToken();
        console.log(`Payment Token: ${paymentToken}`);
        const reserve = await distContract.reserve();
        console.log(`Internal Reserve: ${ethers_1.ethers.formatUnits(reserve, 6)}`);
        // Check Balance of this contract on the Payment Token
        const usdtContract = new ethers_1.ethers.Contract(paymentToken, ["function balanceOf(address) view returns (uint256)"], provider);
        const balance = await usdtContract.balanceOf(TARGET_ADDR);
        console.log(`Actual Balance: ${ethers_1.ethers.formatUnits(balance, 6)}`);
        const cumYield = await distContract.cumulativeYieldPerToken();
        console.log(`Cumulative Yield: ${ethers_1.ethers.formatUnits(cumYield, 6)}`);
    }
    catch (e) {
        console.error("Read Error:", e.message);
    }
}
main();
