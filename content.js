let tooltip = null;
let timeoutId = null;

document.addEventListener("mouseover", (event) => {
    const target = event.target.closest("a");
    if (target && target.href) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fetchExplanation(target), 500);
    } else {
        hideTooltip();
    }
});

function fetchExplanation(linkElement) {
    const urlText = linkElement.innerText || linkElement.href;

    chrome.runtime.sendMessage({ action: "fetchExplanation", text: urlText }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Error sending message to background:", chrome.runtime.lastError);
            return;
        }

        if (response && response.explanation) {
            console.log("✅ Explanation received:", response.explanation);
            showTooltip(linkElement, response.explanation);
        } else {
            console.error("⚠️ No response received from background script.");
        }
    });
}

function showTooltip(linkElement, explanationText) {
    hideTooltip();

    tooltip = document.createElement("div");
    tooltip.className = "hyperlink-tooltip";

    console.log("✅ Tooltip Text Received:", explanationText);

    let what = "No information available.";
    let why = "No information available.";
    let how = "No information available.";

    // ✅ Improved Regex Extraction for "What, Why, How"
    const match = explanationText.match(/What:\s*(.*?)(?:\s*Why:|\n|$)\s*Why:\s*(.*?)(?:\s*How:|\n|$)\s*How:\s*(.*)/s);
    if (match) {
        if (match[1].trim()) what = match[1].trim();
        if (match[2].trim()) why = match[2].trim();
        if (match[3].trim()) how = match[3].trim();
    } else {
        console.error("⚠️ Tooltip text does not match expected format:", explanationText);
    }

    // ✅ Improved HTML structure for better readability
    tooltip.innerHTML = `
        <div class="tooltip-section"><b>What:</b> <span>${what}</span></div>
        <div class="tooltip-section"><b>Why:</b> <span>${why}</span></div>
        <div class="tooltip-section"><b>How:</b> <span>${how}</span></div>
    `;

    document.body.appendChild(tooltip);

    // ✅ Position the tooltip below the hyperlink
    const rect = linkElement.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
}

function hideTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

document.addEventListener("mouseout", () => hideTooltip());
