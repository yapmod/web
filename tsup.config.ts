import { defineConfig } from 'tsup';

export default defineConfig([
  // Chrome extension bundles
  {
    entry: {
      'chrome/content': 'src/core/content.ts',
      'chrome/service-worker': 'src/chrome/service-worker.ts',
    },
    format: ['iife'],
    dts: false,
    splitting: false,
    clean: false,
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
  },
  // Firefox extension bundles
  {
    entry: {
      'firefox/content': 'src/core/content.ts',
      'firefox/background': 'src/firefox/background.ts',
    },
    format: ['iife'],
    dts: false,
    splitting: false,
    clean: true,
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
  },
]);
