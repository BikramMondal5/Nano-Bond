import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Path to the shared JSON registry
const REGISTRY_PATH = path.join(process.cwd(), 'backend', 'src', 'bond-registry.json');

// Helper to read registry
function getRegistry() {
    try {
        if (!fs.existsSync(REGISTRY_PATH)) {
            return { bonds: [] };
        }
        const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading details:', error);
        return { bonds: [] };
    }
}

export async function GET() {
    try {
        const registry = getRegistry();
        // Sort by creation or just return as is
        return NextResponse.json(registry.bonds || []);
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
        const registry = getRegistry();

        // Basic duplicate check
        const exists = registry.bonds.some((b: any) => b.bondId === body.bondId);
        if (exists) {
            return NextResponse.json(
                { error: 'Bond ID already exists' },
                { status: 409 }
            );
        }

        // Add timestamps roughly
        const newBond = {
            ...body,
            // Ensure adminWallet is saved if sent, fallback if not
            adminWallet: body.adminWallet || null,
            createdAt: new Date().toISOString()
        };

        registry.bonds.push(newBond);

        // Write back
        fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

        return NextResponse.json(newBond, { status: 201 });
    } catch (error: any) {
        console.error('Error creating bond:', error);

        return NextResponse.json(
            { error: 'Failed to create bond' },
            { status: 500 }
        );
    }
}
