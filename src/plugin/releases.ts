// Shared config helpers for the web extension.
// The service worker handles all network requests using direct GitHub release
// download URLs, so no caching is needed for the common case.

export interface WebExtConfig {
  version: string; // "latest" or specific tag like "v1.0.0"
  includePrereleases: boolean;
  /** Whether to enable verbose console logging for debugging. */
  verboseLogging: boolean;
  /** Whether to inject Yapmod automatically on matching pages. */
  autoStart: boolean;
  /** Delay in milliseconds before injecting the bundle (for debugging race conditions). */
  injectionDelay: number;
  /** Comma-separated list of additional allowed hosts (e.g. "localhost:3000,127.0.0.1:8080"). */
  allowedHosts: string;
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
    return {
      version: parsed.version || "latest",
      includePrereleases: !!parsed.includePrereleases,
      verboseLogging: !!parsed.verboseLogging,
      autoStart: parsed.autoStart !== false,
      injectionDelay: typeof parsed.injectionDelay === "number" ? parsed.injectionDelay : 0,
      allowedHosts: typeof parsed.allowedHosts === "string" ? parsed.allowedHosts : "",
    };
  } catch {
    return defaultConfig();
  }
}

function defaultConfig(): WebExtConfig {
  return {
    version: "latest",
    includePrereleases: false,
    verboseLogging: false,
    autoStart: true,
    injectionDelay: 0,
    allowedHosts: "",
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
