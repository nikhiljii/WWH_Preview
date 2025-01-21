let tooltip = null;
let linkElement = null;
let hideTimeoutId = null;
let apiCallTimeoutId = null;

document.addEventListener("mouseover", (event) => {
  const hoveredLink = event.target.closest("a"); // Check if hovered element is a hyperlink

  // Check if the hovered link is inside a header, footer, or nav section
  if (hoveredLink && hoveredLink.href) {
    const isInsideHeaderOrFooter = isInsideHeaderOrFooterElement(hoveredLink);

    if (isInsideHeaderOrFooter) {
      return; // Skip API call if the link is inside header, footer, or navigation
    }

    if (linkElement !== hoveredLink) {
      linkElement = hoveredLink;

      // Start a 3-second timer for the API call
      clearTimeout(apiCallTimeoutId);
      apiCallTimeoutId = setTimeout(() => fetchExplanation(hoveredLink), 3000);
    }
  } else {
    linkElement = null;
  }
});

document.addEventListener("mouseout", (event) => {
  const leftLink = event.target.closest("a");
  if (leftLink === linkElement) {
    clearTimeout(apiCallTimeoutId);
    apiCallTimeoutId = null;

    // Start a 5-second timer to hide the tooltip after the mouse leaves
    if (tooltip) {
      hideTimeoutId = setTimeout(() => hideTooltip(), 5000);
    }
  }
});

function fetchExplanation(linkEl) {
  const urlText = linkEl.innerText || linkEl.href;
  console.log("Fetching explanation for:", urlText);

  if (typeof chrome.runtime !== "undefined" && chrome.runtime.sendMessage) {
    // safe to call chrome.runtime.sendMessage
    chrome.runtime.sendMessage(
      { action: "fetchExplanation", text: urlText },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Error sending message to background:",
            chrome.runtime.lastError
          );
          return;
        }

        if (response && response.explanation) {
          console.log("✅ Explanation received:", response.explanation);
          showTooltip(linkEl, response.explanation);
        } else {
          console.error("⚠️ No response received from background script.");
        }
      }
    );
  } else {
    console.error("⚠️ No response received from background script.");
  }
}

function showTooltip(linkEl, explanationText) {
  hideTooltip(); // Remove any existing tooltip

  tooltip = document.createElement("div");
  tooltip.className = "hyperlink-tooltip";

  // Parse the explanation into What, Why, How
  let what = "No information available.";
  let why = "No information available.";
  let how = "No information available.";

  const match = explanationText
    .trim()
    .match(
      /What:\s*(.*?)(?:Why:|\n|$)\s*Why:\s*(.*?)(?:How:|\n|$)\s*How:\s*(.*)/s
    );
  if (match) {
    what = match[1].trim();
    why = match[2].trim();
    how = match[3].trim();
  }

  tooltip.innerHTML = `
    <div class="aih-segment">
      <div class="aih-heading">What: </div>
      <div class="aih-body">${what}</div>
    </div>
    <div class="aih-segment">
      <div class="aih-heading">Why: </div>
      <div class="aih-body">${why}</div>
    </div>
    <div class="aih-segment">
      <div class="aih-heading">How: </div>
      <div class="aih-body">${how}</div>
    </div>
  `;

  document.body.appendChild(tooltip);

  // Position tooltip below the link
  const rect = linkEl.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;

  console.log(tooltip);
}

function hideTooltip() {
  // Ensure tooltip exists before trying to remove it
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }

  // Clear the hideTimeoutId
  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }
}

// Helper function to check if the hovered link is inside a header, footer, or nav
function isInsideHeaderOrFooterElement(linkEl) {
  // Check if the link is inside header, footer, or nav
  const parent = linkEl.closest("header, footer, navbar, nav");
  if (parent) {
    return true;
  }

  // Alternatively, check based on position (for links near the top or bottom of the page)
  const rect = linkEl.getBoundingClientRect();
  const pageHeight = window.innerHeight;

  // Consider elements near the top (e.g., within 100px from the top) or near the bottom (e.g., within 100px from the bottom) as part of the header/footer area
  const isNearTop = rect.top < 100;
  const isNearBottom = rect.bottom > pageHeight - 100;

  return isNearTop || isNearBottom;
}
