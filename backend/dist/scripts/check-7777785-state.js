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
    const TARGET_USER = "0x3cFd863A8713DB5eFeB7A8DD41c94A4D7B5729B8";
    const DISTRIBUTOR = "0x7628bcf891eCd0112EaA2fd23c14aFB583813777"; // 7777785 Distributor
    console.log(`Checking Distributor: ${DISTRIBUTOR}`);
    const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.rpc.url);
    // Check Roles & Yield
    const distContract = new ethers_1.ethers.Contract(DISTRIBUTOR, [
        "function hasRole(bytes32, address) view returns (bool)",
        "function claimableYield(address) view returns (uint256)",
        "function reserve() view returns (uint256)"
    ], provider);
    const DEFAULT_ADMIN_ROLE = ethers_1.ethers.ZeroHash;
    const hasAdmin = await distContract.hasRole(DEFAULT_ADMIN_ROLE, TARGET_USER);
    console.log(`User is Admin? ${hasAdmin}`);
    const claimable = await distContract.claimableYield(TARGET_USER);
    console.log(`Claimable Yield: ${ethers_1.ethers.formatUnits(claimable, 6)} USDT`);
    const reserve = await distContract.reserve();
    console.log(`Reserve: ${ethers_1.ethers.formatUnits(reserve, 6)} USDT`);
}
main();
