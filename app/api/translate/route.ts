import { NextResponse } from 'next/server';
import { LingoDotDevEngine } from "lingo.dev/sdk";

export async function POST(req: Request) {
    try {
        const { texts, targetLocale } = await req.json();
        const apiKey = process.env.NEXT_PUBLIC_LINGO_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const lingo = new LingoDotDevEngine({ apiKey });

        // Parallelize translations
        const translations = await Promise.all(
            texts.map((text: string) =>
                lingo.localizeText(text, {
                    sourceLocale: "en",
                    targetLocale
                })
            )
        );

        return NextResponse.json({ translations });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
    }
}
