import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { defineConfig } from 'tsup';
import { getBabelPresets, getSharedImportsPlugin } from '@yapmod/builder/transform';

/**
 * tsup/esbuild plugin that runs the @yapmod/builder transform pipeline
 * on source files so SolidJS JSX is compiled and solid-js / @yapmod/ui
 * imports are rewritten to use the shared YapmodClient instance.
 */
function solidTransformPlugin() {
  const babelPlugin = getSharedImportsPlugin();
  const presets = getBabelPresets();

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

        // Pass 2: rewrite solid-js and @yapmod/ui imports to yapmod.<ns>
        const second = transformSync(first.code, {
          filename: args.path,
          babelrc: false,
          configFile: false,
          plugins: [babelPlugin],
          sourceType: 'module',
          ast: false,
        });

        if (!second?.code) return undefined;

        // Pass 3: rewrite `yapmod.<ns>` to `globalThis.YapmodClient.api.<ns>`
        // so the web extension's IIFE bundle accesses the shared SolidJS
        // instances exposed on the YapmodClient handle's `api` property.
        // Only match `yapmod.` as a code identifier (not inside string literals)
        // by requiring a word boundary or non-string context before it.
        const third = second.code.replace(
          /(?<![\\"])yapmod\./g,
          'globalThis.YapmodClient.api.',
        );

        return {
          contents: third,
          loader: 'js' as const,
        };
      });
    },
  };
}

export default defineConfig([
  // Chrome extension bundles
  {
    entry: {
      'chrome/content': 'src/core/content.ts',
      'chrome/service-worker': 'src/chrome/service-worker.ts',
      'chrome/plugin-register': 'src/plugin/register.ts',
    },
    format: ['iife'],
    dts: false,
    splitting: false,
    clean: false,
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    esbuildPlugins: [solidTransformPlugin()],
  },
  // Firefox extension bundles
  {
    entry: {
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
  },
]);
