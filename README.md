# Yapmod Web Extension

A cross-browser web extension that automatically injects the [Yapmod](../client/README.md) client bundle into the [Yapin](https://yapin.gg) website. No manual console injection needed.

Works on **Chrome** (Manifest V3) and **Firefox** (WebExtensions) with shared TypeScript source code built by `tsup`.

## How it works

When you visit `yapin.gg`, the extension fetches the latest Yapmod bundle from GitHub and injects it into the page via a dynamic `<script>` tag. The existing dev hot-reload bridge (`window.postMessage`) continues to work unchanged.

## Development

```sh
cd web
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

### Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `web/chrome/` directory (make sure `web/dist/` contains the built files)

### Firefox

1. Open `about:debugging`
2. Click **This Firefox** → **Load Temporary Add-on**
3. Select `web/firefox/manifest.json` (make sure `web/dist/` contains the built files)

## Contributing

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, `chore:`, …) and stay short: one subject line, no long
description body.

## License

This project is licensed under the [GNU General Public License v3.0](../client/LICENSE).
