import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { Investment } from '@/lib/models/Investment';
import Bond from '@/lib/models/Bond';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        await connectDB();

        // Find all successful investments and redemptions for the user
        const investments = await Investment.find({
            walletAddress: { $regex: new RegExp(`^${address}$`, 'i') },
            status: 'SUCCESS',
            type: { $in: ['INVEST', 'REDEEM'] }
        });

        // Calculate current holdings per bond
        const bondHoldings = new Map<string, { amount: number, purchaseDate: Date }>();

        // Sort by timestamp to process in order
        investments.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (const inv of investments) {
            if (!bondHoldings.has(inv.bondId)) {
                bondHoldings.set(inv.bondId, { amount: 0, purchaseDate: inv.timestamp });
            }

            const current = bondHoldings.get(inv.bondId)!;

            if (inv.type === 'INVEST') {
                current.amount += inv.amount;
                // Keep the earliest purchase date or update? Usually earliest for "held since"
            } else if (inv.type === 'REDEEM') {
                current.amount -= inv.amount;
            }
        }

        const enrichedBonds = [];

        for (const [bondId, data] of bondHoldings.entries()) {
            if (data.amount > 0) {
                const bondDetail = await Bond.findOne({ bondId });

                enrichedBonds.push({
                    id: bondId,
                    name: bondDetail ? bondDetail.bondName : `Bond ${bondId}`,
                    amount: data.amount,
                    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '',
                    yield: bondDetail ? `${bondDetail.couponRate}%` : 'N/A',
                    maturityDate: bondDetail && bondDetail.maturityDate ? new Date(bondDetail.maturityDate).toISOString().split('T')[0] : 'N/A',
                    status: 'Active'
                });
            }
        }

        // Update user-bonds.json
        const filePath = path.join(process.cwd(), 'data', 'user-bonds.json');

        let fileData: { users: any[] } = { users: [] };
        if (fs.existsSync(filePath)) {
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                fileData = JSON.parse(fileContent);
            } catch (error) {
                console.error("Error parsing existing user-bonds.json, starting fresh.");
                fileData = { users: [] };
            }
        }

        if (!Array.isArray(fileData.users)) {
            fileData.users = [];
        }

        // Find and update/add user
        const existingUserIndex = fileData.users.findIndex((u: any) => u.walletAddress.toLowerCase() === address.toLowerCase());

        const userData = {
            walletAddress: address,
            bonds: enrichedBonds
        };

        if (existingUserIndex >= 0) {
            fileData.users[existingUserIndex] = userData;
        } else {
            fileData.users.push(userData);
        }

        // Write updates back to file
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 4));

        return NextResponse.json({
            bonds: enrichedBonds
        });

    } catch (error) {
        console.error('Error fetching bond holdings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
