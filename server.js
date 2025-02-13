require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Use Render’s dynamic port

app.use(cors());
app.use(express.json());

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

app.post("/fetchExplanation", async (req, res) => {
    try {
        const userText = req.body.text;
        console.log(`📩 Received request for: ${userText}`);

        if (!DEEPSEEK_API_KEY) {
            console.error("❌ [ERROR] DEEPSEEK_API_KEY is missing in .env file!");
            return res.status(500).json({ error: "Server configuration error: API key is missing." });
        }

        if (!userText || userText.trim() === "") {
            console.error("⚠️ [ERROR] Invalid user input!");
            return res.status(400).json({ error: "Invalid input: Text is required." });
        }

        const prompt = `
        Summarize the following issue in a structured format:
        "${userText}"
        - **What:** Provide a concise brief summary 1-2 sentences.
        - **Why:** Why it matters,provide the key cause in 1-2 sentences.
        - **How:** Sequence of events or context in 1-2 sentences.
        ---
        Summarize the following news article into three structured sections. 
        Return the response **exactly** in this format:

        **What:**
        [Brief summary]

        **Why:**
        [Why it matters]

        **How:**
        [Sequence of events or context]
        `;

        const requestBody = {
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.5
        };

        console.log("📡 Sending request to DeepSeek API:", JSON.stringify(requestBody, null, 2));

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`✅ DeepSeek API Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`⚠️ [ERROR] DeepSeek API failed: ${response.status} ${response.statusText} - ${errorText}`);
            return res.status(response.status).json({ error: `DeepSeek API Error: ${response.status} - ${errorText}` });
        }

        const data = await response.json();
        console.log("✅ [DEBUG] DeepSeek API Response:", JSON.stringify(data, null, 2));

        // ✅ Extract AI-generated explanation
        let explanation = data.choices[0].message.content || "Error: No response from AI.";

        // ✅ Remove any markdown formatting (**bold**, bullet points, etc.)
        explanation = explanation
            .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
            .replace(/•/g, "-") // Replace bullets with dashes
            .replace(/\n+/g, "\n") // Remove excessive new lines
            .trim();

        console.log("✅ [Formatted Explanation]:", explanation);

        res.json({ explanation });

    } catch (error) {
        console.error("❌ [ERROR] Internal Server Error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ✅ Allow external access by listening on 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
