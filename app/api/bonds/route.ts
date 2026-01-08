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
        await connectDB();
        const body = await req.json();

        // Basic validation can be added here or handled by Mongoose schema validation
        const bond = await Bond.create(body);

        return NextResponse.json(bond, { status: 201 });
    } catch (error: any) {
        console.error('Error creating bond:', error);

        // Handle Mongoose duplicate key error (code 11000)
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Bond ID already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create bond' },
            { status: 500 }
        );
    }
}
