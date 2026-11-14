// Shared core: content script that fetches and injects the Yapmod bundle
// Runs at document_idle on *.yapin.gg
// Uses the service worker as a bridge to avoid CORS issues when fetching
// from GitHub (the page's CORS policy blocks direct fetch to github.com).

import { injectBundle } from "./inject.js";
import { readConfig } from "../plugin/releases.js";
import { createWebExtPlugin } from "../plugin/index.js";

/**
 * Requests the service worker to fetch and return the Yapmod bundle source.
 * The service worker handles both the GitHub API call and the bundle download,
 * avoiding CORS restrictions that apply to the content script's page context.
 */
function fetchBundleFromServiceWorker(config: {
  version: string;
  includePrereleases: boolean;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const runtime = (globalThis as any).chrome?.runtime ?? (globalThis as any).browser?.runtime;
    if (!runtime?.sendMessage) {
      reject(new Error("Extension runtime not available"));
      return;
    }
    runtime.sendMessage({ type: "FETCH_BUNDLE", config }, (response: any) => {
      if (response?.error) {
        reject(new Error(response.error));
      } else if (response?.source) {
        resolve(response.source);
      } else {
        reject(new Error("Unexpected response from service worker"));
      }
    });
  });
}

async function loadBundle() {
  try {
    const config = readConfig();
    const source = await fetchBundleFromServiceWorker(config);
    await injectBundle(source);
    console.log("[yapmod-web] Bundle injected successfully");

    // Register the web-ext-plugin after Yapmod boots
    const yapmodClient = (globalThis as any).YapmodClient;
    if (yapmodClient?.registerClientPlugin) {
      try {
        const pluginDef = createWebExtPlugin();
        yapmodClient.registerClientPlugin(pluginDef);
        console.log("[yapmod-web] Web-ext-plugin registered");
      } catch (err) {
        console.warn("[yapmod-web] Failed to register plugin:", err);
      }
    }
  } catch (error) {
    console.warn("[yapmod-web] Failed to load bundle:", error);
    // Retry once after 60s
    setTimeout(() => {
      console.log("[yapmod-web] Retrying bundle load...");
      loadBundle();
    }, 60_000);
  }
}

loadBundle();
