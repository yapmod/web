# Changelog

## v1.0.1

### Changed

- Use the Yapmod desktop application icon in Chrome and Firefox (#9).

### Fixed

- Include the manifests, settings plugin and static assets in development and production builds (#10).
- Limit failed client loads to one retry after 60 seconds and report missing background replies (#11).
- Preserve manifest formatting during version synchronization and check formatting before release (#12).

## v1.0.0

### Added

- Use `@yapmod/types` from npm for full type safety instead of hand-written type mirrors (#7)
- Type plugin registration with `ClientPlugin` and `ClientPluginModule` interfaces for compile-time API contract validation (#7)
- Log client version and check client state before plugin registration for better diagnostics (#7)
- Fallback to prerelease channel when stable channel fetch fails (e.g., no stable release exists) (#7)
- Add `onUnload` lifecycle hook to web extension config plugin (#7)

### Fixed

- Stable channel silently fails when no stable release exists; now falls back to prerelease (#7)

[v1.0.1]: https://github.com/yapmod/web/compare/v1.0.0...v1.0.1
