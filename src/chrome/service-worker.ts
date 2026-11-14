// Chrome background service worker (Manifest V3)
// Minimal handler for extension installation logging.

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[yapmod-web] Extension installed", details.reason);
});
