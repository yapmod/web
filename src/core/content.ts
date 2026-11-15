// Shared core: content script that fetches and injects the Yapmod bundle
// Runs at document_idle on *.yapin.gg
// Uses the service worker as a bridge to avoid CORS issues when fetching
// from GitHub (the page's CORS policy blocks direct fetch to github.com).
// The service worker injects the bundle via chrome.scripting.executeScript
// with world:"MAIN", bypassing the page's Content Security Policy.
// After the Yapmod bundle loads, the plugin registration script is injected
// to register the web extension config client plugin.

import { readConfig } from "../plugin/releases.js";

/**
 * Requests the service worker to fetch and inject the Yapmod bundle.
 * The service worker handles the GitHub API call, bundle download, and
 * injection via chrome.scripting.executeScript (world: "MAIN"), which
 * bypasses the page's CSP that would block Blob URLs or inline scripts.
 */
function fetchAndInjectBundle(config: {
  channel: "stable" | "prerelease";
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const runtime = (globalThis as any).chrome?.runtime ?? (globalThis as any).browser?.runtime;
    if (!runtime?.sendMessage) {
      reject(new Error("Extension runtime not available"));
      return;
    }
    runtime.sendMessage({ type: "FETCH_BUNDLE", config }, (response: any) => {
      if (response?.error) {
        reject(new Error(response.error));
        return;
      } else if (response?.source) {
        // Now ask the service worker to inject the bundle into the page's main world
        runtime.sendMessage(
          { type: "INJECT_BUNDLE", source: response.source },
          (injectResponse: any) => {
            if (injectResponse?.error) {
              reject(new Error(injectResponse.error));
            } else {
              resolve();
            }
          },
        );
        return;
      } else {
        reject(new Error("Unexpected response from service worker"));
        return;
      }
    });
  });
}

/**
 * Fetches the plugin registration script source from the service worker
 * and injects it into the page's main world. This registers the web
 * extension config client plugin with YapmodClient.
 */
function injectPluginRegistration(): void {
  const runtime = (globalThis as any).chrome?.runtime ?? (globalThis as any).browser?.runtime;
  if (!runtime?.sendMessage) {
    console.warn("[yapmod-web] Extension runtime not available for plugin registration");
    return;
  }
  runtime.sendMessage({ type: "GET_PLUGIN_SOURCE" }, (response: any) => {
    if (!response?.source) {
      console.warn("[yapmod-web] No plugin registration source available");
      return;
    }
    runtime.sendMessage(
      { type: "INJECT_BUNDLE", source: response.source },
      (injectResponse: any) => {
        if (injectResponse?.error) {
          console.warn("[yapmod-web] Failed to inject plugin registration:", injectResponse.error);
        } else {
          console.log("[yapmod-web] Plugin registration injected");
        }
      },
    );
  });
}

async function loadBundle() {
  try {
    const config = readConfig();
    await fetchAndInjectBundle(config);
    console.log("[yapmod-web] Bundle injected successfully");
    // Register the web extension config plugin after the Yapmod bundle loads
    injectPluginRegistration();
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
