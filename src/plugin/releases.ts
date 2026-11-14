// GitHub Releases API helper for fetching Yapmod client bundle URLs
// Caches results in localStorage with a 1-hour TTL to avoid rate limits

const GITHUB_RELEASES_URL = "https://api.github.com/repos/yapmod/client/releases?per_page=100";

const CACHE_KEY = "yapmod.releases.cache.v1";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export interface Release {
  tagName: string;
  prerelease: boolean;
  assetUrl: string | null;
}

interface CachedReleases {
  timestamp: number;
  releases: Release[];
}

export function getCachedReleases(): Release[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedReleases = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      return null;
    }
    return cached.releases;
  } catch {
    return null;
  }
}

function setCachedReleases(releases: Release[]) {
  try {
    const cached: CachedReleases = {
      timestamp: Date.now(),
      releases,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore quota errors
  }
}

async function fetchReleases(): Promise<Release[]> {
  const cached = getCachedReleases();
  if (cached) {
    return cached;
  }

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

  setCachedReleases(releases);
  return releases;
}

export interface WebExtConfig {
  version: string; // "latest" or specific tag like "v1.0.0"
  includePrereleases: boolean;
}

const CONFIG_KEY = "yapmod.web-ext-config.v1";

export function readConfig(): WebExtConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { version: "latest", includePrereleases: false };
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || "latest",
      includePrereleases: !!parsed.includePrereleases,
    };
  } catch {
    return { version: "latest", includePrereleases: false };
  }
}

export function writeConfig(config: WebExtConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Resolves the bundle URL for the given config.
 * Returns the download URL for yapmod-client.js from the matching release.
 */
export async function resolveBundleUrl(
  config: WebExtConfig = readConfig(),
): Promise<string | null> {
  const releases = await fetchReleases();

  // Filter by prerelease setting
  const filtered = config.includePrereleases ? releases : releases.filter((r) => !r.prerelease);

  // If a specific version is selected, find it
  if (config.version !== "latest") {
    const found = filtered.find((r) => r.tagName === config.version);
    return found?.assetUrl || null;
  }

  // Otherwise return the latest stable (or latest including prereleases if enabled)
  const latest = filtered[0];
  return latest?.assetUrl || null;
}

/**
 * Returns the list of releases for the version dropdown in settings.
 */
export async function getReleaseList(config: WebExtConfig = readConfig()): Promise<Release[]> {
  const releases = await fetchReleases();
  return config.includePrereleases ? releases : releases.filter((r) => !r.prerelease);
}
