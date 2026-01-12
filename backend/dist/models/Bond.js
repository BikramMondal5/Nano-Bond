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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bond = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BondSchema = new mongoose_1.Schema({
    bondName: {
        type: String,
        required: [true, 'Bond name is required'],
        trim: true,
    },
    bondId: {
        type: String,
        required: [true, 'Bond ID is required'],
        unique: true,
        trim: true,
    },
    issuer: {
        type: String,
        required: [true, 'Issuer is required'],
        trim: true,
    },
    couponRate: {
        type: Number,
        required: [true, 'Coupon rate is required'],
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    maturityDate: {
        type: Date,
        required: [true, 'Maturity date is required'],
    },
    minInvestment: {
        type: Number,
        required: [true, 'Minimum investment is required'],
    },
    maxSubscription: {
        type: Number,
        required: [true, 'Maximum subscription is required'],
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    contractAddress: {
        type: String,
        trim: true,
    },
    treasuryAddress: {
        type: String,
        trim: true,
    },
    distributorAddress: {
        type: String,
        trim: true,
    },
    proofUrl: {
        type: String,
        trim: true,
    },
    adminWallet: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
exports.Bond = mongoose_1.default.models.Bond || mongoose_1.default.model('Bond', BondSchema);
