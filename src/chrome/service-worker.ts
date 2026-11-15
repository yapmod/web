// Chrome background service worker (Manifest V3)
// Acts as a bridge for fetching bundles, avoiding CORS issues
// in the content script's page context.
// Uses direct GitHub release download URLs instead of the GitHub API,
// eliminating the need for caching and avoiding API rate limits.
//
// After injecting the Yapmod bundle, it also injects the plugin registration
// script so the web extension config plugin is registered with YapmodClient.

const GITHUB_BASE = "https://github.com/yapmod/client";
const GITHUB_API_RELEASES_URL = "https://api.github.com/repos/yapmod/client/releases?per_page=100";

// Plugin registration source is embedded at build time by tsup.
// The content script requests it via GET_PLUGIN_SOURCE.
const PLUGIN_REGISTER_SOURCE = ""; // populated by build-time concatenation

interface WebExtConfig {
  channel: "stable" | "prerelease";
}

/**
 * Build the bundle URL based on the selected release channel.
 * - "stable" uses GitHub's /releases/latest/ endpoint (stable only).
 * - "prerelease" falls back to the GitHub API to find the latest prerelease.
 */
function buildDirectBundleUrl(config: WebExtConfig): string | null {
  if (config.channel === "stable") {
    return `${GITHUB_BASE}/releases/latest/download/yapmod-client.js`;
  }
  // Prerelease channel needs the API to find the latest prerelease asset.
  return null;
}

/**
 * Fetch the latest stable release URL from the GitHub API.
 * Used as a fallback when the /releases/latest/ redirect fails
 * (e.g., when no stable release exists yet).
 */
async function fetchLatestStableUrl(): Promise<string | null> {
  const response = await fetch(GITHUB_API_RELEASES_URL);
  if (!response.ok) {
    throw new Error(`GitHub API HTTP ${response.status}`);
  }
  const data = await response.json();
  for (const item of data) {
    if (item.prerelease) continue;
    const asset = item.assets?.find((a: any) => a.name === "yapmod-client.js");
    if (asset?.browser_download_url) return asset.browser_download_url;
  }
  return null;
}

/**
 * Fallback: use the GitHub API to find the latest prerelease asset URL.
 * Only called when includePrereleases is true and version is "latest".
 */
async function fetchLatestPrereleaseUrl(): Promise<string | null> {
  const response = await fetch(GITHUB_API_RELEASES_URL);
  if (!response.ok) {
    throw new Error(`GitHub API HTTP ${response.status}`);
  }
  const data = await response.json();
  for (const item of data) {
    if (!item.prerelease) continue;
    const asset = item.assets?.find((a: any) => a.name === "yapmod-client.js");
    if (asset?.browser_download_url) return asset.browser_download_url;
  }
  return null;
}

function resolveBundleUrl(config: WebExtConfig): string | null {
  return buildDirectBundleUrl(config);
}

// --- Message handler ---

chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  if (message.type === "FETCH_BUNDLE") {
    (async () => {
      try {
        const config: WebExtConfig = message.config || {
          channel: "stable",
        };
        let bundleUrl = resolveBundleUrl(config);

        // Prerelease channel needs the API because GitHub's /releases/latest/ only returns stable.
        if (!bundleUrl && config.channel === "prerelease") {
          bundleUrl = await fetchLatestPrereleaseUrl();
        }

        // Stable channel: try the direct URL first, but if it fails (e.g., no
        // stable release exists yet), fall back to the GitHub API to find the
        // latest stable release, and then try the latest prerelease as a last resort.
        if (config.channel === "stable" && bundleUrl) {
          const response = await fetch(bundleUrl);
          if (!response.ok) {
            // Direct URL failed — likely no stable release. Try the API fallback.
            console.log(
              "[yapmod-web] Stable direct URL failed (HTTP",
              response.status,
              "), trying API fallback",
            );
            bundleUrl = await fetchLatestStableUrl();
            if (!bundleUrl) {
              // No stable release found, fall back to prerelease
              console.log("[yapmod-web] No stable release found, falling back to prerelease");
              bundleUrl = await fetchLatestPrereleaseUrl();
            }
          } else {
            const source = await response.text();
            sendResponse({ source });
            return;
          }
        }

        if (!bundleUrl) {
          sendResponse({ error: "No bundle URL found for current config" });
          return;
        }
        const response = await fetch(bundleUrl);
        if (!response.ok) {
          sendResponse({ error: `HTTP ${response.status}` });
          return;
        }
        const source = await response.text();
        sendResponse({ source });
      } catch (err: any) {
        sendResponse({ error: err.message || String(err) });
      }
    })();
    return true; // keep message channel open for async response
  }

  // Inject the bundle source into the page's main world, bypassing page CSP.
  // chrome.scripting.executeScript with world:"MAIN" runs outside the page's CSP.
  if (message.type === "INJECT_BUNDLE") {
    (async () => {
      try {
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({ error: "No tab ID available" });
          return;
        }
        await chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          injectImmediately: true,
          func: (code: string) => {
            const el = document.createElement("script");
            el.textContent = code;
            document.head.appendChild(el);
            el.remove();
          },
          args: [message.source],
        });
        sendResponse({ ok: true });
      } catch (err: any) {
        sendResponse({ error: err.message || String(err) });
      }
    })();
    return true; // keep message channel open for async response
  }

  // Return the plugin registration script source so the content script
  // can ask the service worker to inject it after the Yapmod bundle loads.
  if (message.type === "GET_PLUGIN_SOURCE") {
    sendResponse({ source: PLUGIN_REGISTER_SOURCE });
    return false;
  }

  return false;
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[yapmod-web] Extension installed", details.reason);
});
