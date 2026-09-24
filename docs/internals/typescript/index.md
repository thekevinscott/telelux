# TypeScript — agent-supervision guide

ESM-only Node packages, `pnpm` + `wireit`, `tsc` for the build, Vitest with factory injection, ESLint + Prettier, typedoc-generated API reference, `putitoutthere` for releases.

## Sub-docs

- [setup.md](setup.md) — Node/pnpm, common libraries, watch mode, monorepo shape, per-package layout, TypeScript configuration, ecosystem cheat sheet
- [style.md](style.md) — what good TS code looks like, type-system idiom reference
- [testing.md](testing.md) — Vitest, factory injection, integration tests against the built artifact
- [shipping.md](shipping.md) — Github, lint + format, public API design, versioning + release, docs, CI/CD, native bindings, CLI architecture
- [review.md](review.md) — pre-review tooling pass, reading-a-PR checklist, common type errors

Cross-cutting repo conventions (changelog/migration fragment philosophy) live in [../repo.md](../repo.md).

## One-paragraph summary

ESM-only Node packages, exports map with per-condition types, `pnpm` + `wireit`, `tsc` for the build, Vitest with factory injection for testable classes, ESLint + Prettier, typedoc-generated API ref, a build wired so the emitted artifact is bundled into the Python wheel (the only published package), a changelog fragment under `packages/<lang>/<pkg>/changelog.d/` on every consumer-observable change, and CI that runs lint + typecheck + test as separate parallel jobs with path filters. `unknown` at boundaries with narrowing; `satisfies` for literal-preserving type checks. Tests run against the *built* artifact, not just source, because that's what consumers install. Small, single-purpose tools composed together — the stack stays legible.
