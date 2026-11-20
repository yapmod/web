# Changelog

## v1.0.0

### Added

- Use `@yapmod/types` from npm for full type safety instead of hand-written type mirrors (#7)
- Type plugin registration with `ClientPlugin` and `ClientPluginModule` interfaces for compile-time API contract validation (#7)
- Log client version and check client state before plugin registration for better diagnostics (#7)
- Fallback to prerelease channel when stable channel fetch fails (e.g., no stable release exists) (#7)
- Add `onUnload` lifecycle hook to web extension config plugin (#7)

### Fixed

- Stable channel silently fails when no stable release exists; now falls back to prerelease (#7)
