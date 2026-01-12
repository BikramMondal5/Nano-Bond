import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'data', 'user-bonds.json');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ bonds: [] }); // No data file yet
        }

        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        // Case insensitive comparison for wallet addresses
        const userRecord = data.users.find((u: any) => u.walletAddress.toLowerCase() === address.toLowerCase());

        return NextResponse.json({
            bonds: userRecord ? userRecord.bonds : []
        });

    } catch (error) {
        console.error('Error reading user bonds:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
