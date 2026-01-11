import { vapi } from "./vapi";

// UI elements
const startBtn = document.getElementById("start") as HTMLButtonElement;
const stopBtn = document.getElementById("stop") as HTMLButtonElement;
const statusText = document.getElementById("status") as HTMLParagraphElement;

// ---- VAPI EVENTS ----
vapi.on("call-start", () => {
    statusText.textContent = "📞 Call started";
    startBtn.disabled = true;
    stopBtn.disabled = false;
});

vapi.on("call-end", () => {
    statusText.textContent = "❌ Call ended";
    startBtn.disabled = false;
    stopBtn.disabled = true;
});

vapi.on("speech-start", () => {
    statusText.textContent = "🗣️ Listening…";
});

vapi.on("speech-end", () => {
    statusText.textContent = "🤖 Responding…";
});

vapi.on("error", (err) => {
    console.error("VAPI Error:", err);
    statusText.textContent = "⚠️ Error occurred";
});

// ---- START CALL ----
startBtn.addEventListener("click", async () => {
    try {
        await vapi.start({
            // Language model
            model: {
                provider: "google",
                model: "gemini-2.5-flash",
                systemPrompt: `
You are a knowledgeable, concise, and helpful AI assistant.
Respond clearly and politely.
        `.trim()
            },

            // Speech pipeline settings
            // Speech pipeline settings
            transcriber: {
                provider: "deepgram"
            },
            voice: {
                provider: "deepgram",
                voiceId: "asteria"
            }
        });
    } catch (err) {
        console.error(err);
        statusText.textContent = "❌ Failed to start call";
    }
});

// ---- STOP CALL ----
stopBtn.addEventListener("click", () => {
    vapi.stop();
});
