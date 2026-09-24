# Repo-wide conventions

Cross-cutting rules that apply across all language packages. Language-specific guidance lives in [`python/`](python/index.md) and [`typescript/`](typescript/index.md).

## Changelog + migration fragments

The changelog and migration record are **append-only fragment folders** inside each package: `packages/<lang>/<pkg>/changelog.d/` and `packages/<lang>/<pkg>/migrations.d/`. The folders *are* the record — no rendered CHANGELOG is assembled at release time, nothing commits back to `main` per release, and fragments are never deleted, rewritten, or "flushed". One fragment per PR, added in that PR, keeps concurrent PRs structurally conflict-free (a shared changelog file makes every pair of in-flight PRs merge-conflict by construction). The philosophy is global — every package follows it.

Every PR that changes public API adds at least one fragment naming each touched package. Enforced in CI by [`changelog.yml`](../../.github/workflows/changelog.yml); a `skip-changelog:` trailer bypasses the check for genuinely internal refactors.

**Filenames** — `YYYY-MM-DD-<slug>.md`, where the date is the UTC *merge* date, not the author date (authored timestamps interleave wrongly across long-lived branches). Plain `ls` sorts chronologically; newest = highest sort order. For version attribution ("which release shipped X"), map fragment dates against tags via `git log --tags --simplify-by-decoration --format='%cI %d'`.

**Changelog fragments** (`packages/<lang>/<pkg>/changelog.d/`) — a few sentences per fragment. Lead with the Keep a Changelog category (`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`); breaking changes carry a `**BREAKING**` marker and link to their sibling `migrations.d/` fragment.

**Migration fragments** (`packages/<lang>/<pkg>/migrations.d/`) — one per breaking change. Each has five sections, in order:

1. **Summary** — one paragraph: what changed and why.
2. **Required changes** — before/after for config, CLI flags, function/method arguments, action inputs. "None" if purely additive.
3. **Deprecations removed** — anything previously warned about that's now gone. "None" if nothing was removed.
4. **Behavior changes without code changes** — same API, different runtime behavior (tag format, exit codes, defaults).
5. **Verification** — commands the consumer runs to confirm the upgrade worked, with the expected output.

**Stubs at the conventional paths** — `packages/<lang>/<pkg>/CHANGELOG.md`, `packages/<lang>/<pkg>/MIGRATIONS.md`, and `docs/migrations.md` are short pointers into the folders, so anyone fetching the conventional filename gets one hop instead of a 404. Never append entries to the stubs.

**Ship the folders in artifacts where the toolchain allows** — today the single published artifact is the Python wheel, and hatchling cannot include files outside the package root, so wheel consumers take the stub → folder hop on GitHub instead.

Public-API surface for the purpose of these fragments: every exported value/type, every CLI flag, every config key, every observable artifact (tag format, GitHub Release body shape). Internal refactors, test-only changes, and docs-only edits stay out.

## Repo shape (post-template prune)

This repo was scaffolded from `template-lib` (Rust core + maturin Python
wrapper + npm-published Node shim) and pruned to its actual shape:

- **No Rust.** `packages/rust/`, the `rust.yml` workflow, all `rust-*`
  justfile recipes, and every maturin/cargo reference are deleted. The
  Python package builds with `hatchling`.
- **One published package: PyPI.** `putitoutthere.toml` declares exactly
  one `[[package]]` (kind `pypi`, name `telelux`).
- **`packages/node/telelux-web` is internal tooling.** It builds the static viewer
  frontend whose output is bundled into the wheel; its `package.json` is
  `"private": true` and carries no `bin` / `optionalDependencies` /
  publish config. npm publishing machinery (`bootstrap-npm.yml`,
  per-platform sub-packages) is deleted.

## Repo gates come from external tools

This repo runs no gate code of its own. putitoutthere validates the release
config, testing-conventions enforces the testing standard, and pr-monitor
gates the merge on the aggregate check set. Workflow YAML is wiring —
`env:`, `if:`, `with:`, and one invocation — with no iteration, `case`
dispatch, or text-munging in a `run:` block.

A gate this repo appears to need for itself is a missing feature in one of
those three. File it upstream. A bespoke checker living here duplicates
someone else's support matrix, drifts from it silently, and is invisible to
every other repo with the same problem.

## CI lanes fire only on the paths that feed them

Every workflow under `.github/workflows/` carries a `paths:` filter, except
`pr-monitor.yml`, which gates the aggregate check set on every PR. Each
package lane (`python-telelux.yml`, `node-telelux-element.yml`, `node-telelux-web.yml`) triggers on its
own subtree minus `changelog.d/`, `migrations.d/`, and `README.md`, and holds
both that package's tests and its testing-conventions gates. `build-check.yml`
mirrors the `putitoutthere.toml` globs; `check.yml` fires only when that config
or a putitoutthere workflow changes. A fragment-only or docs-only PR runs
nothing but the gate.
