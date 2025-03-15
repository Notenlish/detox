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

  // Get all existing rule IDs to remove them
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);

  // Define new rules
  const newRules = blockedSites.map((site, index) => ({
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

  // Remove all old rules before applying new ones
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds, // Remove all rules
    addRules: newRules, // Add fresh rules
  });
}

// Run when extension loads or starts
chrome.runtime.onInstalled.addListener(updateBlockingRules);
chrome.runtime.onStartup.addListener(updateBlockingRules);
