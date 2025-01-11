chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Received message:", request);

    if (request.action === "fetchExplanation") {
        fetchExplanationFromServer(request.text, sendResponse);
        return true; // ✅ Keeps the message port open for async operations
    }
});

async function fetchExplanationFromServer(text, sendResponse) {
    try {
        console.log("📡 [DEBUG] Sending request to proxy server...");

        const response = await fetch("https://wwh-preview.onrender.com/fetchExplanation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            console.error(`⚠️ [ERROR] Proxy Server Failed: ${response.status} ${response.statusText}`);
            sendResponse({ explanation: "Error: Server unavailable." });
            return;
        }

        const data = await response.json();
        console.log("✅ [DEBUG] Server Response:", data);

        sendResponse({ explanation: data.explanation });

    } catch (error) {
        console.error("❌ [ERROR] Fetching explanation failed:", error);
        sendResponse({ explanation: "Error: Server request failed." });
    }
}
