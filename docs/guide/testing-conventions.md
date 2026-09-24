---
diataxis: how-to
---

# Testing conventions

> **Why read this:** the colocated-test rule is the one you meet first and
> trip over most — learn what it asks for and how to pass it locally before
> CI runs it.

This repo follows the [testing-conventions](https://github.com/thekevinscott/testing-conventions)
standard **in full** and enforces it on every PR: coverage, diff-scoped
mutation, mocking hygiene, one-function-per-file, integration-test layout,
and packaging all gate alongside the rule below. `ARCHITECTURE.md` lists the
set. This page covers the colocated rule only.

## The colocated rule

Every source file has a **colocated** unit test named after it:

| Language   | Source        | Colocated test     |
| ---------- | ------------- | ------------------ |
| Python     | `foo.py`      | `foo_test.py`      |
| TypeScript | `foo.ts`      | `foo.test.ts`      |

Move the source, the test moves with it. (Python's `__init__.py` and TypeScript
declaration files `*.d.ts` are exempt.)

## How it's enforced

Each package lane under `.github/workflows/` calls the upstream reusable workflow
in its `conventions` job on every pull request that touches that package. It names no `gates:`, so every applicable rule
runs; the location check is one job among them, failing the build — with the
offending files in the log — on any source file missing its colocated test.

To relax a rule, add an exemption with a `reason` to that package's
`testing-conventions.toml`. Never narrow the workflow with a `gates:`
allowlist: an exemption is scoped and hard-errors once it stops applying, an
allowlist drops a whole rule and stays quiet about it.

Run the location check locally:

```sh
cargo install testing-conventions
testing-conventions unit location --language typescript packages/node/telelux-web/src
testing-conventions unit location --language python packages/python/telelux
```
