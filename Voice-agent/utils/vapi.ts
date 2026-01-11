import Vapi from "@vapi-ai/web";

/**
 * VAPI Client for Next.js
 * IMPORTANT: Only use the PUBLIC VAPI key (pk_*)
 */

// Initialize VAPI client with singleton pattern
let vapiInstance: Vapi | null = null;

export const getVapi = (): Vapi => {
    if (typeof window === 'undefined') {
        throw new Error('VAPI can only be initialized in the browser');
    }

    if (!vapiInstance) {
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;

        if (!apiKey) {
            console.error('VAPI API key not found in environment variables');
            throw new Error('NEXT_PUBLIC_VAPI_API_KEY is not configured');
        }

        vapiInstance = new Vapi(apiKey);
    }

    return vapiInstance;
};
