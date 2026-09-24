# telelux (npm) agent contract

Layers on top of the repo-root `AGENTS.md`. Where the two differ, this file
wins for anything under `packages/node/telelux/`.

## Test tiers

**One tier for now.**

- **Unit** — colocated with their subject as `src/foo.ts` ↔ `src/foo.test.ts`.
  Run by Vitest in Node (`pnpm test_unit`), configured by `vitest.config.ts`.

Vitest is pinned to 3.x, not the 5.x its siblings use: under vitest 5 the
testing-conventions mutation gate reports every mutant as survived even when the
suite kills it by hand, so the gate would be theatre. Verified on this package
with both versions; the siblings' `rules = ["mutation"]` exemptions are the
same symptom. One consequence: the coverage gate forces vitest's `coverage.all`
on, and under vitest 3 that reports an unloaded barrel as 0%, so tests import
through `./index` rather than the module directly.

`src/vitest.config.ts` re-exports the root `vitest.config.ts` for the same
reason `packages/node/telelux-element` does: the coverage gate runs vitest with
`src/` as its cwd, the mutation gate runs it from the package root, and vitest
only reads the config sitting in its own cwd.

Integration and e2e tiers arrive with the first real behavior, once the wrap
direction between this package and `packages/python/telelux` is decided.

## Build

`pnpm build` is `vite build` in library mode, emitting ESM plus type
declarations via `vite-plugin-dts`. `tsc --noEmit` owns type checking.

## Publishing

This package **is published to npm** through `putitoutthere`. See the root
`putitoutthere.toml` for the release entry.
