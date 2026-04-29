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

> ℹ️ There is no automated test suite in this repository. Verify behaviour manually or with integration tests against the Chrome Web Store API.

## Project Layout

```
src/
  index.ts    # action entry point: reads inputs, calls CWS API, handles errors
  cws.ts      # Chrome Web Store API client (upload, publish, status polling)
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

### Getting OAuth2 credentials locally

Use the included mock OAuth2 app to obtain a refresh token without a real OAuth2 client:

```console
node oauth-mock-app/server.mjs
```

Then follow the printed instructions in your browser.

## Conventions

- **TypeScript strict mode** — all types must be explicit; avoid `any`.
- **Linter:** Biome — run `pnpm lint` before committing. `useLiteralKeys` and `noUselessElse` rules are disabled.
- **Formatter:** Biome with space indentation.
- **Node.js ≥ 24** is required.
- **Conventional Commits** are required for all commits (`feat:`, `fix:`, `chore:`, etc.).
- **Never commit `dist/`** — it is built by CI and deployed to the `latest` branch on release.
- **Never commit OAuth2 credentials** — always use GitHub Actions secrets.
- The `action.yml` `main` field points to `index.js` inside `dist/`, not the TypeScript source.
