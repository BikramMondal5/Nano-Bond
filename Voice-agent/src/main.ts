import { vapi } from "./vapi";
import { weilliptic } from "./weilliptic";

// UI elements
const startBtn = document.getElementById("start") as HTMLButtonElement;
const stopBtn = document.getElementById("stop") as HTMLButtonElement;
const statusText = document.getElementById("status") as HTMLParagraphElement;

// Get wallet address if available (from localStorage or window)
const getWalletAddress = (): string | null => {
    if (typeof window !== 'undefined') {
        // Try to get wallet from localStorage (common pattern)
        const storedWallet = localStorage.getItem('walletAddress') ||
            localStorage.getItem('userAddress') ||
            localStorage.getItem('address');
        if (storedWallet) return storedWallet;

        // Try to get from window object (if set by Web3 provider)
        if ((window as any).ethereum?.selectedAddress) {
            return (window as any).ethereum.selectedAddress;
        }
    }
    return null;
};

// Initialize Weilliptic connection on page load
weilliptic.connect().then(() => {
    console.log("🔗 Weilliptic ready for voice agent logging");
}).catch(console.error);

// ---- VAPI EVENTS ----
vapi.on("call-start", () => {
    statusText.textContent = "📞 Call started";
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Log call start to WeilChain with wallet ID
    const walletId = getWalletAddress();
    weilliptic.logVoiceEvent(walletId, 'call_start');
});

vapi.on("call-end", () => {
    statusText.textContent = "❌ Call ended";
    startBtn.disabled = false;
    stopBtn.disabled = true;

    // Log call end to WeilChain with wallet ID
    const walletId = getWalletAddress();
    weilliptic.logVoiceEvent(walletId, 'call_end');
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

    // Log errors to WeilChain with wallet ID
    const walletId = getWalletAddress();
    weilliptic.logVoiceEvent(walletId, 'error', err?.message || 'Unknown error');
});

// ---- START CALL ----
startBtn.addEventListener("click", async () => {
    try {
        await vapi.start({
            // Language model
            model: {
                provider: "google",
                model: "gemini-2.5-flash",
                messages: [
                    {
                        role: "system",
                        content: "You are a knowledgeable, concise, and helpful AI assistant. Respond clearly and politely."
                    }
                ]
            } as any,

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
