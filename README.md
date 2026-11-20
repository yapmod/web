# Yapmod Web Extension

A cross-browser web extension that automatically injects the [Yapmod](https://github.com/yapmod/client) client bundle into the [Yapin](https://yapin.gg) website. No manual console injection needed.

Works on **Chrome** (Manifest V3) and **Firefox** (WebExtensions) with shared TypeScript source code built by `tsup`.

## How it works

When you visit `yapin.gg`, the extension fetches the latest Yapmod bundle from GitHub and injects it into the page via a dynamic `<script>` tag. The existing dev hot-reload bridge (`window.postMessage`) continues to work unchanged.

## Development

```sh
pnpm install
pnpm dev
```

The development build watches for TypeScript changes and rebuilds to `dist/` automatically.

## Commands

| Command           | Description               |
| ----------------- | ------------------------- |
| `pnpm dev`        | Build and watch for changes |
| `pnpm build`      | Build for production      |
| `pnpm typecheck`  | Type-check the source     |
| `pnpm lint`       | Run Oxlint                |
| `pnpm format`     | Format with Oxfmt         |

## Loading the extension

Download the archive for your browser from [GitHub Releases](https://github.com/yapmod/web/releases/latest) and extract it, or run `pnpm build` from a local checkout.

### Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the extracted `chrome.zip` directory, or `dist/chrome/` after a local build.

### Firefox

1. Open `about:debugging`
2. Click **This Firefox** → **Load Temporary Add-on**
3. Select `manifest.json` from the extracted `firefox.zip` directory, or `dist/firefox/manifest.json` after a local build.

## Contributing

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, `chore:`, …) and stay short: one subject line, no long
description body.

## License

The extension and its icons are licensed under the [GNU General Public License v3.0](LICENSE).
The 32px and 128px icons come directly from the Yapmod desktop application. The 16px and 48px variants are resized from its 512px icon. [Original desktop artwork](https://github.com/ilyeshdz/yapmod/tree/b90b6740334ef35fefee44c9da0c518c4f575535/src-tauri/icons)
