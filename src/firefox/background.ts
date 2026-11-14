// Firefox background script (WebExtensions API)
// Acts as a bridge for fetching bundles, avoiding CORS issues
// in the content script's page context.
// Uses direct GitHub release download URLs instead of the GitHub API,
// eliminating the need for caching and avoiding API rate limits.

const GITHUB_BASE = "https://github.com/yapmod/client";
const GITHUB_API_RELEASES_URL =
  "https://api.github.com/repos/yapmod/client/releases?per_page=100";

interface WebExtConfig {
  version: string;
  includePrereleases: boolean;
}

/**
 * Build a direct download URL for a release asset.
 * - "latest" uses GitHub's /releases/latest/ endpoint (stable only).
 * - A specific tag like "v1.1.0" uses /releases/download/{tag}/.
 */
function buildDirectBundleUrl(config: WebExtConfig): string | null {
  if (config.version === "latest") {
    // GitHub's /releases/latest/ only returns the latest stable (non-prerelease) release.
    // If the user wants prereleases, we fall back to the API below.
    if (config.includePrereleases) return null;
    return `${GITHUB_BASE}/releases/latest/download/yapmod-client.js`;
  }
  // Specific version tag
  const tag = config.version.startsWith("v") ? config.version : `v${config.version}`;
  return `${GITHUB_BASE}/releases/download/${tag}/yapmod-client.js`;
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

browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  if (message.type === "FETCH_BUNDLE") {
    (async () => {
      try {
        const config: WebExtConfig = message.config || {
          version: "latest",
          includePrereleases: false,
        };
        let bundleUrl = resolveBundleUrl(config);

        // If includePrereleases is true and version is "latest", fall back to the API
        // because GitHub's /releases/latest/ only returns stable releases.
        if (!bundleUrl && config.includePrereleases && config.version === "latest") {
          bundleUrl = await fetchLatestPrereleaseUrl();
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
  // browser.scripting.executeScript with world:"MAIN" runs outside the page's CSP.
  if (message.type === "INJECT_BUNDLE") {
    (async () => {
      try {
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({ error: "No tab ID available" });
          return;
        }
        await browser.scripting.executeScript({
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

  return false;
});

browser.runtime.onInstalled.addListener((details) => {
  console.log("[yapmod-web] Extension installed", details.reason);
});
