"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const errorSignature = "ERC20InsufficientBalance(address,uint256,uint256)";
const selector = ethers_1.ethers.id(errorSignature).slice(0, 10);
console.log(`Selector for ${errorSignature}: ${selector}`);
const errorInsufficientAllowance = "ERC20InsufficientAllowance(address,uint256,uint256)";
const selectorAuth = ethers_1.ethers.id(errorInsufficientAllowance).slice(0, 10);
console.log(`Selector for ${errorInsufficientAllowance}: ${selectorAuth}`);
