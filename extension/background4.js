console.log("SKIBIDI DOP DOP DOP DOP Background script is running!");

async function loadBlockedSites() {
  const response = await fetch(chrome.runtime.getURL("blocked_sites.txt"));
  const text = await response.text();

  return text
    .split("\n")
    .map((site) => site.trim())
    .filter((site) => site.length > 0 && !site.startsWith("#"));
}

async function updateBlockingRules() {
  const blockedSites = await loadBlockedSites();

  // Separate YouTube channel names and URL-based blocking
  const youtubeChannels = new Set();
  const blockedUrls = [];

  blockedSites.forEach((site) => {
    if (site.startsWith("channel:")) {
      youtubeChannels.add(site.replace("channel:", "").trim().toLowerCase());
    } else {
      blockedUrls.push(site);
    }
  });

  // Store blocked YouTube channels for webRequest handling
  chrome.storage.local.set({ youtubeChannels: Array.from(youtubeChannels) });

  // Get all existing rules to remove them
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);

  // Define new rules for URL-based blocking
  const newRules = blockedUrls.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: "https://drive.google.com/" },
    },
    condition: {
      urlFilter: site,
      resourceTypes: ["main_frame"],
    },
  }));

  // Remove old rules and apply new ones
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules,
  });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle channel check requests
  if (message.type === "CHECK_YOUTUBE_CHANNEL") {
    const channelName = message.channelName.toLowerCase();
    console.log("Received channel check request for:", channelName);

    chrome.storage.local.get("youtubeChannels", ({ youtubeChannels }) => {
      if (youtubeChannels && youtubeChannels.includes(channelName)) {
        console.log(`Blocking channel: ${channelName}`);
        chrome.tabs.update(sender.tab.id, { url: "https://drive.google.com/" });
      } else {
        console.log(`Channel "${channelName}" is allowed.`);
      }

      if (sendResponse) {
        sendResponse({
          blocked: youtubeChannels && youtubeChannels.includes(channelName),
        });
      }
    });

    return true; // Required for async sendResponse
  }
});

// Run when extension loads or starts
chrome.runtime.onInstalled.addListener(() => {
  updateBlockingRules();
});

chrome.runtime.onStartup.addListener(() => {
  updateBlockingRules();
});
