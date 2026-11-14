import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import presetSolid from 'babel-preset-solid';
import presetTypescript from '@babel/preset-typescript';
import type { PluginObj } from '@babel/core';
import { types as t } from '@babel/core';
import { defineConfig } from 'tsup';

/*
 * Babel plugin that rewrites solid-js imports onto the shared yapmod
 * instance so the bundle never carries a second copy of Solid.
 * Mirrors the logic in @yapmod/builder's transform.ts.
 */
const SHARED_MODULES: Record<string, string> = {
  'solid-js': 'solid',
  'solid-js/web': 'solidWeb',
  'solid-js/store': 'solidStore',
};

function sharedAccess(namespace: string) {
  return t.memberExpression(t.identifier('yapmod'), t.identifier(namespace));
}

function rewriteSharedImports(): PluginObj {
  return {
    name: 'yapmod:rewrite-shared-imports',
    visitor: {
      ImportDeclaration(path) {
        const namespace = SHARED_MODULES[path.node.source.value];
        if (namespace === undefined) return;

        if (path.node.importKind === 'type') {
          path.remove();
          return;
        }

        const statements = [];
        const named = [];

        for (const specifier of path.node.specifiers) {
          if (t.isImportNamespaceSpecifier(specifier)) {
            statements.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(specifier.local, sharedAccess(namespace)),
              ]),
            );
            continue;
          }
          if (t.isImportDefaultSpecifier(specifier)) {
            statements.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  specifier.local,
                  t.memberExpression(sharedAccess(namespace), t.identifier('default')),
                ),
              ]),
            );
            continue;
          }
          if (specifier.importKind === 'type') continue;
          named.push(specifier);
        }

        if (named.length > 0) {
          const properties = [];
          for (const specifier of named) {
            const key = t.isIdentifier(specifier.imported)
              ? specifier.imported
              : t.stringLiteral(specifier.imported.value);
            properties.push(t.objectProperty(key, specifier.local));
          }
          statements.push(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.objectPattern(properties), sharedAccess(namespace)),
            ]),
          );
        }

        if (statements.length === 0) {
          path.remove();
          return;
        }
        path.replaceWithMultiple(statements);
      },
    },
  };
}

/**
 * tsup/esbuild plugin that runs the @yapmod/builder transform pipeline
 * on source files so SolidJS JSX is compiled and solid-js imports are
 * rewritten to use the shared yapmod instance.
 */
function solidTransformPlugin() {
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
          presets: [presetSolid, presetTypescript],
          sourceType: 'module',
          ast: false,
          cloneInputAst: false,
        });

        if (!first?.code) return undefined;

        // Pass 2: rewrite solid-js imports to yapmod.solid...
        const second = transformSync(first.code, {
          filename: args.path,
          babelrc: false,
          configFile: false,
          plugins: [rewriteSharedImports()],
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
