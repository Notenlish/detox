console.log("YouTube monitor script initialized");

// Track processed URLs to avoid duplicate checks
const processedUrls = new Set();

// Function to check the channel name and block if needed
function checkChannelName() {
  // Only run on watch pages
  if (!window.location.href.includes("/watch")) {
    return;
  }

  // Skip if we've already checked this exact URL
  if (processedUrls.has(window.location.href)) {
    console.log("Already checked URL:", window.location.href);
    return;
  }

  console.log("Checking channel for:", window.location.href);

  // Try to get the channel name
  const channelName = getChannelName();
  if (!channelName) {
    // Try again after a short delay if channel name not found
    console.log("Channel name not found, will retry...");
    setTimeout(checkChannelName, 1000);
    return;
  }

  // Mark this URL as processed
  processedUrls.add(window.location.href);

  // Send message to background to check if channel is blocked
  console.log("Found channel name:", channelName);
  chrome.runtime.sendMessage(
    { type: "CHECK_YOUTUBE_CHANNEL", channelName },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error checking channel:", chrome.runtime.lastError);
        return;
      }
      console.log("Channel check response:", response);
    }
  );
}

function getChannelName() {
  // Try multiple selectors for better reliability
  const selectors = [
    "div#upload-info a", // Standard layout
    "ytd-video-owner-renderer a", // Alternative layout
    "#channel-name a", // Another possible layout
    "#owner-name a", // Yet another possible layout
    "a.ytd-channel-name", // One more possible layout
    "#owner #text", // Even another possible layout
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText || element.textContent;
      if (text && text.trim()) {
        return text.trim();
      }
    }
  }

  return null; // Channel name not found
}

// Function to handle YouTube navigation
function handleNavigation() {
  console.log("Navigation detected, current URL:", window.location.href);

  // Only run on watch pages
  if (window.location.href.includes("/watch")) {
    // Wait for YouTube to update its content
    setTimeout(checkChannelName, 1500);
  }
}

// Run initial check
handleNavigation();

// Set up listener for YouTube navigation
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleNavigation();
  }
});

// Start observing the document for changes
observer.observe(document, { subtree: true, childList: true });

// Also listen for history API usage
window.addEventListener("popstate", handleNavigation);

// Try to detect YouTube's own navigation events
window.addEventListener("yt-navigate-finish", handleNavigation);
window.addEventListener("yt-page-data-updated", handleNavigation);

// Periodically check for URL changes (backup method)
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleNavigation();
  }
}, 2000);
