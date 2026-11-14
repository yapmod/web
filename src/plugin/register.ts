// Plugin registration script: bundles createWebExtPlugin and calls
// globalThis.YapmodClient.registerClientPlugin() to register the web
// extension config plugin after the Yapmod bundle has loaded.
//
// This file is built as a standalone IIFE and injected by the service worker
// immediately after the Yapmod bundle injection succeeds.

import { createWebExtPlugin } from "./index.js";

(function () {
  const YapmodClient = (globalThis as any).YapmodClient;
  if (!YapmodClient || typeof YapmodClient.registerClientPlugin !== "function") {
    console.warn("[yapmod-web] YapmodClient not available; skipping plugin registration");
    return;
  }

  const plugin = createWebExtPlugin();
  const result = YapmodClient.registerClientPlugin(plugin);
  if (result) {
    console.log("[yapmod-web] Web extension config plugin registered");
  } else {
    console.warn("[yapmod-web] Failed to register web extension config plugin");
  }
})();
