import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bond from '@/lib/models/Bond';

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
        const body = await req.json();
        await connectDB();

        // Check if bondId already exists
        const exists = await Bond.findOne({ bondId: body.bondId });
        if (exists) {
            return NextResponse.json(
                { error: 'Bond ID already exists' },
                { status: 409 }
            );
        }

        // Create new bond
        // Mongoose will handle type casting for numbers/dates defined in schema
        // and ignore fields not in schema (unless strict is false)
        const newBond = await Bond.create({
            ...body,
            // adminWallet is now in schema
            // timestamps are handled by schema
        });

        return NextResponse.json(newBond, { status: 201 });
    } catch (error: any) {
        console.error('Error creating bond:', error);

        return NextResponse.json(
            { error: 'Failed to create bond' },
            { status: 500 }
        );
    }
}
