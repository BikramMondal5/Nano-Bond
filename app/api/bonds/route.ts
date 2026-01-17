import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bond from '@/lib/models/Bond';
import { BondService } from '../../../backend/src/services/bond.service';
import dotenv from 'dotenv';
import path from 'path';

// Load backend environment variables
const backendEnvPath = path.resolve(process.cwd(), 'backend/.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');

console.log('[API] Loading Env. CWD:', process.cwd());

if (process.env.PRIVATE_KEY) {
    console.log('[API] PRIVATE_KEY already set in process.env');
} else {
    // Try backend/.env
    const resultBackend = dotenv.config({ path: backendEnvPath });
    if (resultBackend.error) {
        console.log('[API] Failed to load backend/.env');
        // Try .env at root
        const resultRoot = dotenv.config({ path: rootEnvPath });
        if (resultRoot.error) console.log('[API] Failed to load .env at root');
        else console.log('[API] Loaded .env from root');
    } else {
        console.log('[API] Loaded backend/.env');
    }
}

// Define a bond data interface if possible, or use any
interface BondData {
    bondId: string;
    bondName: string;
    autoDeploy?: boolean;
    [key: string]: any;
}

export async function GET() {
    try {
        await connectDB();
        const bonds = await Bond.find({}).sort({ createdAt: -1 });
        return NextResponse.json(bonds);
    } catch (error) {
        console.error('Error fetching bonds:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bonds' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body: BondData = await req.json();
        await connectDB();

        // Check if bondId already exists
        const exists = await Bond.findOne({ bondId: body.bondId });
        if (exists) {
            return NextResponse.json(
                { error: 'Bond ID already exists' },
                { status: 409 }
            );
        }

        let bondData = { ...body };

        // AUTO-DEPLOYMENT LOGIC
        if (body.autoDeploy) {
            console.log(`[API] Auto-deploying contracts for ${body.bondId}...`);
            try {
                // Initialize service
                const bondService = new BondService();

                // Ensure adminWallet is provided
                const adminWallet = body.adminWallet;
                if (!adminWallet) {
                    return NextResponse.json(
                        { error: 'Admin wallet address is required for auto-deployment' },
                        { status: 400 }
                    );
                }

                // Use createManagedBond to handle deployment, role granting, and DB saving
                const result = await bondService.createManagedBond({
                    bondId: body.bondId,
                    bondName: body.bondName,
                    issuer: body.issuer,
                    couponRate: Number(body.couponRate),
                    minInvestment: Number(body.minInvestment),
                    maxSubscription: Number(body.maxSubscription),
                    startDate: new Date(body.startDate),
                    maturityDate: new Date(body.maturityDate),
                    description: body.description || ""
                }, adminWallet);

                console.log(`[API] Deployment and setup success. Result:`, result);
                return NextResponse.json(result, { status: 201 });

            } catch (deployError: any) {
                console.error('[API] Auto-deployment failed:', deployError);
                return NextResponse.json(
                    { error: `Deployment failed: ${deployError.message}` },
                    { status: 500 }
                );
            }
        }

        // Manual Creation (No Auto-Deploy)
        const newBond = await Bond.create(bondData);

        return NextResponse.json(newBond, { status: 201 });
    } catch (error: any) {
        console.error('Error creating bond:', error);
        return NextResponse.json(
            { error: 'Failed to create bond' },
            { status: 500 }
        );
    }
}
