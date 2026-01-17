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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const User_1 = require("../models/User");
const KYCSubmission_1 = require("../models/KYCSubmission");
dotenv.config();
const checkKYC = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        const address = '0x3725931e0d2577d76654e455a0e73a05bc761cc1';
        console.log(`Checking KYC for address: ${address}`);
        const submission = await KYCSubmission_1.KYCSubmission.findOne({ walletAddress: address.toLowerCase() });
        console.log('Found submission:', submission);
        if (submission) {
            console.log(`[DEBUG] KYCSubmission STATUS: ${submission.status}`);
        }
        else {
            console.log('[DEBUG] No KYCSubmission found.');
        }
        const user = await User_1.User.findOne({ walletAddress: address.toLowerCase() });
        console.log('Found User:', user);
        if (user) {
            console.log(`[DEBUG] User kycStatus: ${user.kycStatus}`);
        }
        else {
            console.log('[DEBUG] No User found.');
        }
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('Error:', error);
    }
};
checkKYC();
