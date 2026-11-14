// Shared config and cache helpers for the web extension.
// The service worker handles all network requests (GitHub API + bundle download).
// This module only provides localStorage-based config read/write and cache access.

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

/**
 * Read cached releases from localStorage. Returns null if not cached or expired.
 * The service worker populates this cache when fetching from the GitHub API.
 */
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

export interface WebExtConfig {
  version: string; // "latest" or specific tag like "v1.0.0"
  includePrereleases: boolean;
}

const CONFIG_KEY = "yapmod.web-ext-config.v1";

/**
 * Read the web extension config from localStorage.
 */
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

/**
 * Write the web extension config to localStorage.
 */
export function writeConfig(config: WebExtConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore quota errors
  }
}
