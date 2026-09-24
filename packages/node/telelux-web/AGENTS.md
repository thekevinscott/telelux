# Frontend agent contract

Layers on top of the repo-root `AGENTS.md`. Where the two differ, this file
wins for anything under `packages/node/telelux-web/`.

## Test tiers

**Two tiers, and only two.**

- **Unit** — colocated with their subject as `src/Foo.tsx` ↔ `src/Foo.test.tsx`.
  Run by Vitest in jsdom (`pnpm test_unit`), configured by `vitest.config.ts`.
- **Integration** — under `tests/`, never colocated. Run by Playwright against a
  real browser and a real built page (`pnpm test_integration`), configured by
  `playwright.config.ts`.

Each tier has its own runner and its own config file. `vitest.config.ts`
excludes `tests/`; `playwright.config.ts` sets `testDir: './tests'`. Neither
runner may collect the other's files.

`src/vitest.config.ts` re-exports the root `vitest.config.ts` and is not a
second config. The testing-conventions coverage gate runs vitest with `src/` as
its cwd while the mutation gate runs it from the package root, and vitest only
reads the config sitting in its own cwd — so the settings have to be reachable
from both. Keep the real settings in the root file and keep every path in it
absolute or cwd-agnostic.

**There is no e2e tier in this package, and none is to be added.** The repo-root
`AGENTS.md` describes an e2e attestation model; it does not apply here. The
frontend's outermost meaningful boundary is a browser loading the built page,
and that is exactly what the Playwright integration tier already exercises. An
e2e tier on top would re-run the same assertions through a second runner for no
added coverage. E2e belongs to `packages/python/telelux`, where a real process boundary
(the installed wheel, the CLI) exists to cross.

Both tiers run in CI (`.github/workflows/node-telelux-web.yml`). That is deliberate and
distinguishes them from Python's e2e tier, which never runs in CI.

## Build

`pnpm build` is `vite build`. There is no build script in this package and none
is to be written — a hand-rolled builder is a second thing to maintain that
nobody asked for. Vite owns the bundle; `tsc --noEmit` owns type checking.

## Publishing

This package is **never published**. The built `dist/` is bundled into the
Python wheel at `packages/python/telelux` build time. `private: true` in `package.json`
records that, but the directory's role is what states it.
