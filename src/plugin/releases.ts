// Shared config helpers for the web extension.
// The service worker handles all network requests using direct GitHub release
// download URLs, so no caching is needed for the common case.

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
