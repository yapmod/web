// Post-build script that embeds the plugin registration script source
// into the service worker / background script bundles.
// Called after `tsup` finishes building all entries.

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

function embed(platform, bgFileName) {
  const pluginPath = resolve(root, `dist/${platform}/plugin-register.js`);
  const bgPath = resolve(root, `dist/${platform}/${bgFileName}`);

  const pluginSource = readFileSync(pluginPath, 'utf-8');
  const escaped = pluginSource
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

  let bgSource = readFileSync(bgPath, 'utf-8');
  bgSource = bgSource.replace(
    /var PLUGIN_REGISTER_SOURCE = "";/,
    `var PLUGIN_REGISTER_SOURCE = '${escaped}';`,
  );
  writeFileSync(bgPath, bgSource);
  console.log(`[embed-plugin-source] Embedded plugin source into dist/${platform}/${bgFileName}`);
}

try {
  embed('chrome', 'service-worker.js');
  embed('firefox', 'background.js');
} catch (err) {
  console.error('[embed-plugin-source] Failed:', err.message);
  process.exit(1);
}
