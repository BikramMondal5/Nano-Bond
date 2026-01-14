
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

console.log(`Checking .env at: ${envPath}`);

if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');

    // Correct Address from deployed_addresses.json
    const correctAddress = "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1";

    // Regex to find USDT_ADDRESS assignment
    const regex = /^USDT_ADDRESS=.*$/m;

    if (regex.test(content)) {
        console.log("Found USDT_ADDRESS in .env. Updating...");
        const newContent = content.replace(regex, `USDT_ADDRESS=${correctAddress}`);
        fs.writeFileSync(envPath, newContent);
        console.log("✅ Updated USDT_ADDRESS in .env");
    } else {
        console.log("USDT_ADDRESS not found in .env. appending...");
        fs.appendFileSync(envPath, `\nUSDT_ADDRESS=${correctAddress}\n`);
        console.log("✅ Appended USDT_ADDRESS to .env");
    }
} else {
    console.error("❌ .env file NOT FOUND!");
}
