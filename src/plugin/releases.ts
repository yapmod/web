// Shared config helpers for the web extension.
// The service worker handles all network requests using direct GitHub release
// download URLs, so no caching is needed for the common case.

export interface WebExtConfig {
  // Which release channel to use: "stable" for latest stable, "prerelease" for latest pre-release.
  channel: "stable" | "prerelease";
}

const CONFIG_KEY = "yapmod.web-ext-config.v1";

/**
 * Read the web extension config from localStorage.
 */
export function readConfig(): WebExtConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw);
    const channel = parsed.channel === "prerelease" ? "prerelease" : "stable";
    return { channel };
  } catch {
    return defaultConfig();
  }
}

function defaultConfig(): WebExtConfig {
  return {
    channel: "stable",
  };
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
