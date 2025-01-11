document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("apiKey");
    const saveButton = document.getElementById("save");
    const status = document.getElementById("status");

    // ✅ Load the saved API key when the options page is opened
    chrome.storage.local.get(["openAiApiKey"], function (data) {
        if (data.openAiApiKey) {
            apiKeyInput.value = data.openAiApiKey;
        }
    });

    // ✅ Save API key when the button is clicked
    saveButton.addEventListener("click", function () {
        const apiKey = apiKeyInput.value.trim();

        if (apiKey) {
            chrome.storage.local.set({ openAiApiKey: apiKey }, function () {
                status.textContent = "✅ API Key saved successfully!";
                status.style.color = "green";
                setTimeout(() => (status.textContent = ""), 3000);
            });
        } else {
            status.textContent = "⚠️ Please enter a valid API Key.";
            status.style.color = "red";
        }
    });
});
