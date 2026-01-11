import Vapi from "@vapi-ai/web";

/**
 * IMPORTANT:
 * - This file should only contain the PUBLIC VAPI key (pk_*)
 * - Do NOT put your Deepgram / Gemini keys here
 */
export const vapi = new Vapi(import.meta.env.VITE_VAPI_API_KEY);
