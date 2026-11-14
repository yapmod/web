// Firefox background script (WebExtensions API)
// Acts as a bridge for fetching releases and bundles, avoiding CORS issues
// in the content script's page context.

const GITHUB_RELEASES_URL = "https://api.github.com/repos/yapmod/client/releases?per_page=100";

const CACHE_KEY = "yapmod.releases.cache.v1";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface Release {
  tagName: string;
  prerelease: boolean;
  assetUrl: string | null;
}

interface CachedReleases {
  timestamp: number;
  releases: Release[];
}

interface WebExtConfig {
  version: string;
  includePrereleases: boolean;
}

// --- Cached releases storage via browser.storage.local ---
// Background scripts cannot use localStorage.

async function getCachedReleases(): Promise<Release[] | null> {
  try {
    const result = await browser.storage.local.get(CACHE_KEY);
    const cached = result[CACHE_KEY];
    if (!cached) return null;
    const parsed: CachedReleases = cached as CachedReleases;
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      return null;
    }
    return parsed.releases;
  } catch {
    return null;
  }
}

async function setCachedReleases(releases: Release[]) {
  try {
    const cached: CachedReleases = { timestamp: Date.now(), releases };
    await browser.storage.local.set({ [CACHE_KEY]: cached });
  } catch {
    // Ignore quota errors
  }
}

async function fetchReleases(): Promise<Release[]> {
  const cached = await getCachedReleases();
  if (cached) return cached;

  const response = await fetch(GITHUB_RELEASES_URL);
  if (!response.ok) {
    throw new Error(`GitHub API HTTP ${response.status}`);
  }
  const data = await response.json();
  const releases: Release[] = data.map((item: any) => {
    const asset = item.assets?.find((a: any) => a.name === "yapmod-client.js");
    return {
      tagName: item.tag_name,
      prerelease: item.prerelease,
      assetUrl: asset?.browser_download_url || null,
    };
  });
  await setCachedReleases(releases);
  return releases;
}

function resolveBundleUrl(releases: Release[], config: WebExtConfig): string | null {
  const filtered = config.includePrereleases ? releases : releases.filter((r) => !r.prerelease);
  if (config.version !== "latest") {
    const found = filtered.find((r) => r.tagName === config.version);
    return found?.assetUrl || null;
  }
  return filtered[0]?.assetUrl || null;
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
        const releases = await fetchReleases();
        const bundleUrl = resolveBundleUrl(releases, config);
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
