import { readFileSync } from 'node:fs';
import { copyFile, cp } from 'node:fs/promises';
import { transformSync } from '@babel/core';
import { defineConfig } from 'tsup';
import {
  getBabelPresets,
  getSharedImportsPlugin,
  getYapmodGlobalPlugin,
} from '@yapmod/builder/transform';

/**
 * tsup/esbuild plugin that runs the @yapmod/builder transform pipeline
 * on source files so SolidJS JSX is compiled and solid-js / @yapmod/ui
 * imports are rewritten to use the shared YapmodClient instance.
 */
function solidTransformPlugin() {
  const presets = getBabelPresets();
  const sharedImportsPlugin = getSharedImportsPlugin();
  const yapmodGlobalPlugin = getYapmodGlobalPlugin();

  return {
    name: 'yapmod:solid-transform',
    setup(build: any) {
      build.onLoad({ filter: /\.(?:[cm]?[jt]sx?)$/ }, (args: any) => {
        if (args.path.includes('node_modules')) return undefined;

        const source = readFileSync(args.path, 'utf8');

        // Pass 1: compile TypeScript + JSX with Solid preset
        const first = transformSync(source, {
          filename: args.path,
          babelrc: false,
          configFile: false,
          presets,
          sourceType: 'module',
          ast: false,
          cloneInputAst: false,
        });

        if (!first?.code) return undefined;

        // Pass 2: rewrite solid-js / @yapmod/ui imports to yapmod.<ns>,
        // then resolve the `yapmod` free variable to globalThis.YapmodClient.
        const second = transformSync(first.code, {
          filename: args.path,
          babelrc: false,
          configFile: false,
          plugins: [sharedImportsPlugin, yapmodGlobalPlugin],
          sourceType: 'module',
          ast: false,
        });

        if (!second?.code) return undefined;

        return {
          contents: second.code,
          loader: 'js' as const,
        };
      });
    },
  };
}

export default defineConfig({
  entry: {
    'chrome/content': 'src/core/content.ts',
    'chrome/service-worker': 'src/chrome/service-worker.ts',
    'chrome/plugin-register': 'src/plugin/register.ts',
    'firefox/content': 'src/core/content.ts',
    'firefox/background': 'src/firefox/background.ts',
    'firefox/plugin-register': 'src/plugin/register.ts',
  },
  format: ['iife'],
  dts: false,
  splitting: false,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  esbuildPlugins: [solidTransformPlugin()],
  async onSuccess() {
    for (const browser of ['chrome', 'firefox']) {
      const output = `dist/${browser}`;
      await copyFile(`src/${browser}/manifest.json`, `${output}/manifest.json`);
      await cp('src/assets/icons', `${output}/icons`, { recursive: true });
      await copyFile('LICENSE', `${output}/LICENSE`);
    }
  },
});
