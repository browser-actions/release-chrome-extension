# Agentic Coding Guide

This file provides guidance for AI coding agents working in this repository.

## Repository Purpose

`release-chrome-extension` is a GitHub Action that publishes a Chrome extension to the Chrome Web Store using the Chrome Web Store API with OAuth2 authentication.

## Commands

```bash
pnpm install --frozen-lockfile   # install dependencies
pnpm lint                        # lint with Biome (CI mode, no auto-fix)
pnpm lint:fix                    # lint with auto-fix
pnpm build                       # compile TypeScript → dist/index.js
pnpm package                     # copy action.yml + README.md into dist/
```

> ℹ️ There is no unit test suite in this repository. Correctness is verified
> manually, with integration tests against the Chrome Web Store API, and with
> the `e2e` job (see below) that exercises the packaged action end-to-end
> against a fully mocked, offline API server.

## Project Layout

```
src/
  index.ts    # action entry point: reads inputs, calls CWS API, handles errors
  cws.ts      # Chrome Web Store API client (upload, publish, status polling)
test/
  mock-server.mjs   # standalone mock server for Google OAuth2 token + CWS upload/publish endpoints, used by the e2e job
oauth-mock-app/
  server.mjs  # local OAuth2 mock server for obtaining a refresh token during development
action.yml    # action metadata: inputs, outputs, runs.using: node24
biome.json    # linter/formatter config
```

## Architecture

The action flow is:

1. Read `extension-id`, `extension-path`, and OAuth2 credentials from action inputs.
2. Use `cws.ts` to upload the new extension zip to the Web Store draft.
3. Publish the uploaded version.

`cws.ts` wraps the Google APIs client (`googleapis`) for the Chrome Web Store. OAuth2 tokens are constructed from the provided client ID, client secret, and refresh token.

### Build output is ESM

`package.json` has `"type": "module"` and `tsconfig.json` targets
`module: "ESNext"` / `moduleResolution: "Bundler"`, so `@actions/core`
(ESM-only since v3) can be imported statically in `src/index.ts`. `ncc`
compiles the bundle as ESM and emits a `dist/package.json` containing
`{"type": "module"}` alongside `dist/index.js`, so the packaged action
runs correctly under Node regardless of any consumer's own
`package.json`.

### Getting OAuth2 credentials locally

Use the included mock OAuth2 app to obtain a refresh token without a real OAuth2 client:

```console
node oauth-mock-app/server.mjs
```

Then follow the printed instructions in your browser.

### End-to-end test (`e2e` CI job)

`.github/workflows/build.yml` has an `e2e` job that runs the **packaged**
action (`uses: ./dist`) against a fully mocked, offline API server
(`test/mock-server.mjs`), so it never talks to the real Chrome Web Store or
Google OAuth2 endpoints. This is the most faithful test available since the
real GitHub Actions runner handles `action.yml` parsing and input→env
mapping exactly as it would for real consumers.

Both external services can be redirected via env vars, read only in
`src/index.ts` and passed to `CWSClient`:

- `CWS_API_ORIGIN` — overrides the Chrome Web Store API origin (defaults to
  `https://www.googleapis.com`).
- `GOOGLE_API_ORIGIN` — overrides the Google OAuth2 token endpoint origin
  (defaults to `https://oauth2.googleapis.com`).

These are plain env vars, not action inputs — they are not documented in
`action.yml` and have no effect unless explicitly set, so real workflows are
unaffected. To rehearse the e2e job locally:

```console
npm run build && npm run package
node test/mock-server.mjs &
CWS_API_ORIGIN=http://127.0.0.1:8787 \
GOOGLE_API_ORIGIN=http://127.0.0.1:8787 \
INPUT_EXTENSION-ID=... INPUT_EXTENSION-PATH=... \
INPUT_OAUTH-CLIENT-ID=... INPUT_OAUTH-CLIENT-SECRET=... INPUT_OAUTH-REFRESH-TOKEN=... \
node dist/index.js
```

## Conventions

- **TypeScript strict mode** — all types must be explicit; avoid `any`.
- **Linter:** Biome — run `pnpm lint` before committing. Uses the `recommended` rules preset (no rule-specific overrides).
- **Formatter:** Biome with space indentation.
- **Node.js ≥ 24** is required.
- **Conventional Commits** are required for all commits (`feat:`, `fix:`, `chore:`, etc.).
- **Never commit `dist/`** — it is built by CI and deployed to the `latest` branch on release.
- **Never commit OAuth2 credentials** — always use GitHub Actions secrets.
- The `action.yml` `main` field points to `index.js` inside `dist/`, not the TypeScript source.
