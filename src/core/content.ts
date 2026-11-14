// Shared core: content script that fetches and injects the Yapmod bundle
// Runs at document_idle on *.yapin.gg

import { injectBundle } from "./inject.js";
import { readConfig, resolveBundleUrl } from "../plugin/releases.js";
import { createWebExtPlugin } from "../plugin/index.js";

async function loadBundle() {
  try {
    const config = readConfig();
    const bundleUrl = await resolveBundleUrl(config);
    if (!bundleUrl) {
      throw new Error("No bundle URL found for current config");
    }

    const response = await fetch(bundleUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const source = await response.text();
    injectBundle(source);
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
