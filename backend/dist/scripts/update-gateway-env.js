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
    // New Gateway Address
    const newGateway = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB";
    const regex = /^SWAP_GATEWAY_ADDRESS=.*$/m;
    if (regex.test(content)) {
        console.log("Found SWAP_GATEWAY_ADDRESS in .env. Updating...");
        const newContent = content.replace(regex, `SWAP_GATEWAY_ADDRESS=${newGateway}`);
        fs_1.default.writeFileSync(envPath, newContent);
        console.log(`✅ Updated SWAP_GATEWAY_ADDRESS to ${newGateway}`);
    }
    else {
        console.log("SWAP_GATEWAY_ADDRESS not found in .env. appending...");
        fs_1.default.appendFileSync(envPath, `\nSWAP_GATEWAY_ADDRESS=${newGateway}\n`);
        console.log(`✅ Appended SWAP_GATEWAY_ADDRESS to .env`);
    }
}
else {
    console.error("❌ .env file NOT FOUND!");
}
