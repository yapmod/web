// Shared core: content script that fetches and injects the Yapmod bundle
// Runs at document_idle on *.yapin.gg

import { injectBundle } from './inject.js';

const BUNDLE_URL =
  'https://raw.githubusercontent.com/yapmod/client/main/apps/client/dist/yapmod-client.js';

async function loadBundle() {
  try {
    const response = await fetch(BUNDLE_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const source = await response.text();
    injectBundle(source);
    console.log('[yapmod-web] Bundle injected successfully');
  } catch (error) {
    console.warn('[yapmod-web] Failed to load bundle:', error);
    // Retry once after 60s
    setTimeout(() => {
      console.log('[yapmod-web] Retrying bundle load...');
      loadBundle();
    }, 60_000);
  }
}

loadBundle();
