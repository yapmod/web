// Plugin registration script: bundles createWebExtPlugin and calls
// globalThis.YapmodClient.registerClientPlugin() to register the web
// extension config plugin after the Yapmod bundle has loaded.
//
// This file is built as a standalone IIFE and injected by the service worker
// immediately after the Yapmod bundle injection succeeds.

import type { ClientHandle } from '@yapmod/types';
import { createWebExtPlugin } from './index.js';

(function () {
  const YapmodClient = (globalThis as any).YapmodClient as ClientHandle & {
    registerClientPlugin(plugin: unknown): boolean;
  };
  if (!YapmodClient || typeof YapmodClient.registerClientPlugin !== 'function') {
    console.warn('[yapmod-web] YapmodClient not available; skipping plugin registration');
    return;
  }

  // Log the loaded client version for diagnostics — helps identify
  // channel/version mismatches when debugging fetch failures.
  console.log('[yapmod-web] YapmodClient version:', YapmodClient.version);

  // Check client state before registration — if the bundle is already
  // disposed, registration will fail silently.
  if (YapmodClient.state === 'disposed') {
    console.warn('[yapmod-web] YapmodClient is disposed; skipping plugin registration');
    return;
  }

  const plugin = createWebExtPlugin();
  const result = YapmodClient.registerClientPlugin(plugin);
  if (result) {
    console.log('[yapmod-web] Web extension config plugin registered');
  } else {
    console.warn(
      '[yapmod-web] Failed to register web extension config plugin (version:',
      YapmodClient.version,
      ', state:',
      YapmodClient.state,
      ')',
    );
  }
})();
