# Changelog

## [Unreleased]

### Added

- Use `@yapmod/types` from npm for full type safety instead of hand-written type mirrors (#7)
- Type plugin registration with `ClientPlugin` and `ClientPluginModule` interfaces for compile-time API contract validation (#7)
- Log client version and check client state before plugin registration for better diagnostics (#7)
- Fallback to prerelease channel when stable channel fetch fails (e.g., no stable release exists) (#7)
- Add `onUnload` lifecycle hook to web extension config plugin (#7)

### Fixed

- Stable channel silently fails when no stable release exists; now falls back to prerelease (#7)

### [Unreleased]: https://github.com/yapmod/web/compare/v1.4.0...HEAD
## v1.4.0

### 🚀 Enhancements

- Separate Chrome and Firefox extension packages (bd3d73b)
- Fetch from GitHub releases and add web-ext-plugin (a361a75)
- Use direct GitHub release URLs instead of API (6ff1acc)
- Add client plugin with SolidJS JSX support (7db151c)
- Use @yapmod/builder transform exports and add @yapmod/ui support (ba1f6d2)
- Add automated release workflow with version bumping (2385c1f)
- Add Switch, Input, Select components to extension settings and bump to v1.3.0 (4cc38aa)
- **web:** Simplify plugin settings to release channel selector (#2)
- **web:** Replace api: any with YapmodPluginApi type (#4)

### 🩹 Fixes

- Add packages field to pnpm-workspace.yaml (c39c489)
- Make tsconfig.json self-contained for CI (d1a1f29)
- Add background entry points and fix gitignore (285e269)
- Wait for bundle load and use createComponent for plugin UI (fe985e8)
- Add github.com permission and use cached releases in plugin (cf39eee)
- Use service worker bridge to avoid CORS when fetching bundle (906c3a8)
- Use chrome.storage.local instead of localStorage in service worker (76c4b9c)
- Add release-assets.githubusercontent.com to host permissions (4833008)
- Use Blob URL to bypass CSP inline script restriction (6f79b74)
- Use chrome.scripting.executeScript to bypass CSP for blob URLs (8dc7852)
- Add host permission for yapin.gg to allow scripting API (59bb40f)
- Move host permission to host_permissions for Manifest V3 (55a4833)
- Rewrite yapmod. to YapmodClient.api. and bump version to 1.2.4 (d60dcdc)
- Regenerate lockfile with npm package reference for @yapmod/builder (ec2f684)
- Resolve infinite loop in web-ext-config plugin (e19902e)
- Skip commit in release workflow when version unchanged (c59ebf8)
- Handle existing tags in release workflow (0ae5d82)

### 💅 Refactors

- **plugin:** Remove createMemo workaround now that storage proxy is reactive (#3)

### 🏡 Chore

- Initial commit (59298b6)
- Add oxlint, oxfmt, and AGENTS.md (6a274c6)
- Bump version to 1.2.5 (cc40e40)
- Bump version to 1.2.6 (3353fad)
- Bump version to 1.2.7 (21a9018)

### 🤖 CI

- Add release workflow and bump version to 1.0.0 (e2de441)

### ❤️ Contributors

- Ilyes Hernandez ([@ilyeshdz](https://github.com/ilyeshdz))
- Junie <junie@jetbrains.com>
- Hdzilyes ([@ilyeshdz](https://github.com/ilyeshdz))