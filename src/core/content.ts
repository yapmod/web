// Shared core: content script that fetches and injects the Yapmod bundle
// Runs at document_idle on *.yapin.gg
// Uses the service worker as a bridge to avoid CORS issues when fetching
// from GitHub (the page's CORS policy blocks direct fetch to github.com).
// The service worker injects the bundle via chrome.scripting.executeScript
// with world:"MAIN", bypassing the page's Content Security Policy.

import { readConfig } from "../plugin/releases.js";

/**
 * Requests the service worker to fetch and inject the Yapmod bundle.
 * The service worker handles the GitHub API call, bundle download, and
 * injection via chrome.scripting.executeScript (world: "MAIN"), which
 * bypasses the page's CSP that would block Blob URLs or inline scripts.
 */
function fetchAndInjectBundle(config: {
  version: string;
  includePrereleases: boolean;
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
        runtime.sendMessage({ type: "INJECT_BUNDLE", source: response.source }, (injectResponse: any) => {
          if (injectResponse?.error) {
            reject(new Error(injectResponse.error));
          } else {
            resolve();
          }
        });
        return;
      } else {
        reject(new Error("Unexpected response from service worker"));
        return;
      }
    });
  });
}

async function loadBundle() {
  try {
    const config = readConfig();
    await fetchAndInjectBundle(config);
    console.log("[yapmod-web] Bundle injected successfully");
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
