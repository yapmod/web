<div align="center">
  <img src="https://raw.githubusercontent.com/yapmod/desktop/c3b333cc802e2bf6094cb368771faac8916f6739/docs/images/banner.svg" width="870" alt="Yapmod" />
  <h1>Yapmod Web</h1>
  <p>Use your Yapmod themes and plugins when you open Yapin in Chrome or Firefox.</p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL%20v3-blue" alt="GPL v3 license" /></a>
    <a href="https://github.com/yapmod/web/releases/latest/download/chrome.zip"><img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4" alt="Download for Chrome (Manifest V3)" /></a>
    <a href="https://github.com/yapmod/web/releases/latest/download/firefox.zip"><img src="https://img.shields.io/badge/Firefox-WebExtension-FF7139" alt="Download for Firefox" /></a>
    <a href="https://github.com/yapmod/web/releases"><img src="https://img.shields.io/github/downloads/yapmod/web/total" alt="Total release asset downloads" /></a>
  </p>
</div>

## Installation

### Chrome

1. Download and extract [chrome.zip](https://github.com/yapmod/web/releases/latest/download/chrome.zip).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the extracted folder that contains `manifest.json`.

### Firefox

1. Download [firefox.zip](https://github.com/yapmod/web/releases/latest/download/firefox.zip).
2. Open `about:debugging` and select **This Firefox**.
3. Click **Load Temporary Add-on** and select the ZIP. Repeat this step after restarting Firefox. [Firefox temporary installation guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

Open Yapin, or reload an existing Yapin tab. The extension loads the Yapmod client into the page. If you already use Yapin in this browser profile, you can keep using the same session. [Open Yapin](https://www.yapin.gg/)

## Settings and updates

Open **Settings → Yapmod → Extension** to choose **Stable** or **Pre-release** as the client release channel. Reload the Yapin tab to apply your choice.

| Component | How it updates |
| --- | --- |
| Browser extension | Download the latest ZIP for your browser. In Chrome, replace the contents of the unpacked folder and click **Reload** on the extension. In Firefox, load the new ZIP as a temporary add-on. [Extension releases](https://github.com/yapmod/web/releases/latest) |
| Yapmod client | The extension fetches the client from GitHub when Yapin loads. **Stable** is the default and falls back to a pre-release if no stable build is available. A failed client load gets one retry after 60 seconds. [Client releases](https://github.com/yapmod/client/releases) |

## Development

From the repository root, install the dependencies and start the watch build. The release workflow uses Node.js 20 and pnpm 12.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For Chrome, load `dist/chrome/` as an unpacked extension. For Firefox, load `dist/firefox/manifest.json` as a temporary add-on. After a rebuild, reload the extension in the browser and refresh the Yapin tab.

| Command | Result |
| --- | --- |
| `pnpm build` | Builds both browser packages in `dist/`. |
| `pnpm test` | Builds and tests both content scripts, including retry and error handling. |
| `pnpm typecheck` | Checks the TypeScript source. |
| `pnpm lint` | Runs Oxlint. |
| `pnpm format` / `pnpm format:check` | Formats the source with Oxfmt or checks its formatting. |

Use a short Conventional Commit subject when contributing. [Conventional Commits](https://www.conventionalcommits.org/) · [Changelog](CHANGELOG.md) · [Maintenance instructions](AGENTS.md)

## License and artwork

Yapmod Web is licensed under GPL-3.0. The banner comes from Yapmod Desktop. The extension uses the original desktop application's 32px and 128px icons, with the 16px and 48px sizes scaled from the 512px artwork. [License](LICENSE) · [Banner](https://github.com/yapmod/desktop/blob/c3b333cc802e2bf6094cb368771faac8916f6739/docs/images/banner.svg) · [Original icons](https://github.com/ilyeshdz/yapmod/tree/b90b6740334ef35fefee44c9da0c518c4f575535/src-tauri/icons)

<p align="center">Yapmod Web is an independent Yapin community project.</p>
