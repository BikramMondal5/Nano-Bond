
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

console.log(`Checking .env at: ${envPath}`);

if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');

    // New Gateway Address
    const newGateway = "0x1ce9C1Bd6dAd58F7f1EfFABd2ad038A36b7619FB";

    const regex = /^SWAP_GATEWAY_ADDRESS=.*$/m;

    if (regex.test(content)) {
        console.log("Found SWAP_GATEWAY_ADDRESS in .env. Updating...");
        const newContent = content.replace(regex, `SWAP_GATEWAY_ADDRESS=${newGateway}`);
        fs.writeFileSync(envPath, newContent);
        console.log(`✅ Updated SWAP_GATEWAY_ADDRESS to ${newGateway}`);
    } else {
        console.log("SWAP_GATEWAY_ADDRESS not found in .env. appending...");
        fs.appendFileSync(envPath, `\nSWAP_GATEWAY_ADDRESS=${newGateway}\n`);
        console.log(`✅ Appended SWAP_GATEWAY_ADDRESS to .env`);
    }
} else {
    console.error("❌ .env file NOT FOUND!");
}
