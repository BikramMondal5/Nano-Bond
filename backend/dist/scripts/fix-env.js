"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(process.cwd(), '.env');
console.log(`Checking .env at: ${envPath}`);
if (fs_1.default.existsSync(envPath)) {
    let content = fs_1.default.readFileSync(envPath, 'utf8');
    // Correct Address from deployed_addresses.json
    const correctAddress = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";
    // Regex to find USDT_ADDRESS assignment
    const regex = /^USDT_ADDRESS=.*$/m;
    if (regex.test(content)) {
        console.log("Found USDT_ADDRESS in .env. Updating...");
        const newContent = content.replace(regex, `USDT_ADDRESS=${correctAddress}`);
        fs_1.default.writeFileSync(envPath, newContent);
        console.log("✅ Updated USDT_ADDRESS in .env");
    }
    else {
        console.log("USDT_ADDRESS not found in .env. appending...");
        fs_1.default.appendFileSync(envPath, `\nUSDT_ADDRESS=${correctAddress}\n`);
        console.log("✅ Appended USDT_ADDRESS to .env");
    }
}
else {
    console.error("❌ .env file NOT FOUND!");
}
