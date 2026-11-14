import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    content: 'src/core/content.ts',
    inject: 'src/core/inject.ts',
    'service-worker': 'src/chrome/service-worker.ts',
    background: 'src/firefox/background.ts',
  },
  format: ['iife'],
  dts: false,
  splitting: false,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
});
