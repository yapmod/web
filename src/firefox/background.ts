// Firefox background script (WebExtensions API)
// Minimal handler for extension installation logging.

browser.runtime.onInstalled.addListener((details) => {
  console.log("[yapmod-web] Extension installed", details.reason);
});
