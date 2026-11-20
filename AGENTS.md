# AGENTS.md

Yapmod Web is a cross-browser extension that automatically injects the Yapmod client bundle into the Yapin page. It builds IIFE bundles for Chrome (Manifest V3) and Firefox (WebExtensions) from shared TypeScript source using `tsup`.

## Commands

Run from the `web/` directory. Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev          # tsup --watch -> dist/
pnpm build        # production bundle
pnpm typecheck    # tsc --noEmit
pnpm lint         # oxlint
pnpm format       # oxfmt (format:check to verify)
```

There are no tests. The build outputs IIFE bundles to `dist/`, which are loaded by the browser extension manifests in `chrome/` and `firefox/`.

## Layout

```text
src/core/           # shared core logic
  content.ts        # content script: fetches and injects the Yapmod bundle
  inject.ts         # dynamic <script> tag injection helper
chrome/             # Chrome Manifest V3 extension (manifest.json, loads dist/)
firefox/            # Firefox WebExtensions (manifest.json, loads dist/)
```

The `tsup.config.ts` entry points map to Chrome and Firefox-specific wrappers (`src/chrome/service-worker.ts`, `src/firefox/background.ts`) that delegate to the shared core.

## Runtime model

- `content.ts` runs at `document_idle` on `*.yapin.gg`. It fetches the Yapmod bundle from GitHub raw content and injects it via `injectBundle()`.
- `inject.ts` creates a temporary inline `<script>` tag with the bundle source, appends it to `<head>`, and removes it after execution.
- If the fetch fails, the content script retries once after 60 seconds.
- The bundle URL is hardcoded to the `yapmod/client` repository's latest dist file on `main`.

## Conventions

- TypeScript targets ES2020; the build output is IIFE format. Avoid newer APIs like `Array.prototype.toSorted`.
- Use `globalThis` instead of `window` where possible.
- Errors are logged with a `[yapmod-web]` prefix. Fetch failures retry after 60s.
- Types: the root `tsconfig.json` is strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `noUnused*`). Use `import type` for type-only imports.
- Formatting: Oxfmt — 2 spaces, single quotes, semicolons, trailing commas, width 100.
- Lint: disable a rule only with `// oxlint-disable-next-line <rule> -- <reason>`.
- Naming: lowercase single-word files (`content.ts`, `inject.ts`), descriptive function names.
- Comments explain _why_. Keep the rationale inline with the code.

## Critical constraints

- **CSP:** The bundle is injected via a temporary inline `<script>` tag, matching the same approach used by the client's plugin evaluation. No `eval` or `new Function`.
- **The bundle URL points to `raw.githubusercontent.com`.** The `connect-src` allowlist on Yapin permits this host. Failed fetches retry after 60s.
- **Build target is `es2020`.** The tsup config sets this explicitly.

## Git Commits

- **Commit as the repository owner, never as an AI agent or assistant.** Use the user's Git identity — currently `Ilyes Hernandez <hdz.ilyes@gmail.com>` — for author and committer. Never use `Junie`, an AI assistant, a placeholder, or any other agent identity, and do not override it with `--author` or environment variables.
- Before committing, verify `git config user.name` and `git config user.email` match the repository owner. If they do not, fix the configuration or stop and ask the user instead of committing under the wrong identity.
- **Never use co-author trailers.** Do not append `Co-authored-by` or any similar trailer to commit messages.
- When committing changes, always use [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `feat: add plugin export`, `fix: handle missing theme`, `chore: update deps`).
- Commit and push directly to the branch. Do not create pull requests, branches for review, or any other PR-related workflow.
