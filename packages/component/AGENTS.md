# Component agent contract

Layers on top of the repo-root `AGENTS.md`. Where the two differ, this file
wins for anything under `packages/component/`.

## Test tiers

**Two tiers, and only two.**

- **Unit** — colocated with their subject as `src/Foo.ts` ↔ `src/Foo.test.ts`.
  Run by Vitest in jsdom (`pnpm test_unit`), configured by `vitest.config.ts`.
- **Integration** — under `tests/`, never colocated. Run by Playwright against a
  real browser and the built package (`pnpm test_integration`), configured by
  `playwright.config.ts`.

`src/vitest.config.ts` re-exports the root `vitest.config.ts` for the same
reason `packages/frontend` does: the coverage gate runs vitest with `src/` as
its cwd, the mutation gate runs it from the package root, and vitest only
reads the config sitting in its own cwd.

**There is no e2e tier in this package.** The outermost meaningful boundary is
a browser loading the built package, and the Playwright integration tier
already exercises that.

## Build

`pnpm build` is `vite build` in library mode, emitting ESM plus type
declarations via `vite-plugin-dts`. There is no hand-rolled build script —
Vite owns the bundle, `tsc --noEmit` owns type checking.

## Publishing

This package **is published to npm** through `putitoutthere`, unlike its
`packages/frontend` sibling. See the root `putitoutthere.toml` for the release
entry.
