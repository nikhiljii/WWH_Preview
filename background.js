chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Received message:", request);

    if (request.action === "fetchExplanation") {
        fetchExplanation(request, sendResponse);
        return true;  // ✅ Keeps the message port open for async operations
    }
});

async function fetchExplanation(request, sendResponse) {
    try {
        const data = await new Promise((resolve) => {
            chrome.storage.local.get(["apiKey"], resolve);
        });

        if (!data.apiKey) {
            console.error("❌ API Key not found!");
            sendResponse({ explanation: "Error: API key not found. Set it in extension settings." });
            return;
        }

        const HF_API_KEY = data.apiKey;
        const MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.3";  // ✅ Ensure model exists

        const prompt = `Analyze the issue:
        "${request.text}"
        
        Respond **ONLY** in this format without extra text:
        What: [Briefly state the issue]
        Why: [Explain the underlying reasons]
        How: [Describe the mechanisms or processes involved]`;

        console.log("📡 Sending API Request...");

        const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_NAME}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt })
        });

        console.log("✅ API Response Status:", response.status);

        if (!response.ok) {
            console.error(`⚠️ API Request Failed: ${response.status} ${response.statusText}`);
            sendResponse({ explanation: `Error: API request failed with status ${response.status}` });
            return;
        }

        const dataResponse = await response.json();
        console.log("🔍 Full API Response:", JSON.stringify(dataResponse, null, 2));

        if (dataResponse.error) {
            console.error("⚠️ API Error:", dataResponse.error);
            sendResponse({ explanation: `Error: ${dataResponse.error}` });
            return;
        }

        const responseText = dataResponse[0]?.generated_text || dataResponse.generated_text || "Error: No response from model.";
        console.log("✅ Extracted Text:", responseText);

        let what = "No information available.";
        let why = "No information available.";
        let how = "No information available.";

        const match = responseText.match(/What:\s*(.*?)\s*Why:\s*(.*?)\s*How:\s*(.*)/s);
        if (match) {
            what = match[1].trim() || "No information available.";
            why = match[2].trim() || "No information available.";
            how = match[3].trim() || "No information available.";
        } else {
            console.error("⚠️ Response format mismatch. **RAW RESPONSE:**", responseText);
        }

        sendResponse({ explanation: `What: ${what}\nWhy: ${why}\nHow: ${how}` });

    } catch (error) {
        console.error("❌ Fetch Error:", error);
        sendResponse({ explanation: "Error: Failed to fetch data from Hugging Face API." });
    }
}
