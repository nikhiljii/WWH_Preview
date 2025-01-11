document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("saveBtn").addEventListener("click", function() {
        const apiKey = document.getElementById("apiKeyInput").value.trim();

        if (apiKey) {
            chrome.storage.local.set({ apiKey: apiKey }, function() {
                document.getElementById("status").innerText = "API Key saved successfully!";
            });
        } else {
            document.getElementById("status").innerText = "Please enter a valid API key.";
        }
    });

    document.getElementById("loadBtn").addEventListener("click", function() {
        chrome.storage.local.get(["apiKey"], function(data) {
            if (data.apiKey) {
                document.getElementById("apiKeyInput").value = data.apiKey;
                document.getElementById("status").innerText = "API Key loaded successfully!";
            } else {
                document.getElementById("status").innerText = "No API Key found. Please enter one.";
            }
        });
    });
});
