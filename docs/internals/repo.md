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

**Stubs at the conventional paths** — `packages/<lang>/<pkg>/CHANGELOG.md` and `packages/<lang>/<pkg>/MIGRATIONS.md` are short pointers into the folders, so anyone fetching the conventional filename gets one hop instead of a 404. Never append entries to the stubs.

**Ship the folders in artifacts where the toolchain allows** — hatchling cannot include files outside the package root, so wheel consumers take the stub → folder hop on GitHub instead. The npm packages' `"files"` allowlists ship `dist` only, so npm consumers take the same hop.

Public-API surface for the purpose of these fragments: every exported value/type, every CLI flag, every config key, every observable artifact (tag format, GitHub Release body shape). Internal refactors, test-only changes, and docs-only edits stay out.

## Repo shape (post-template prune)

This repo was scaffolded from `template-lib` (Rust core + maturin Python
wrapper + npm-published Node shim) and pruned to its actual shape:

- **No Rust.** `packages/rust/`, the `rust.yml` workflow, all `rust-*`
  justfile recipes, and every maturin/cargo reference are deleted. The
  Python package builds with `hatchling`.
- **Three published packages.** `putitoutthere.toml` declares PyPI
  `telelux`, npm `telelux-element` (the web component), and npm `telelux`
  (a placeholder for Node tooling).
- **`packages/node/telelux-web` is the app shell, and it is not published.** It builds
  the single-file viewer that GitHub Pages serves at `https://telelux.dev/`,
  and [#6](https://github.com/thekevinscott/telelux/issues/6) will bundle the
  same file into the wheel. Its `package.json` is `"private": true` and
  carries no `bin` / `optionalDependencies` / publish config. The template's
  per-platform npm machinery (`bootstrap-npm.yml`, per-platform
  sub-packages) is deleted.

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
or a putitoutthere workflow changes. `viewer-pages.yml` and `docs.yml` fire on
the inputs of the site each one builds. A fragment-only or docs-only PR runs
nothing but the gate.

## Transcripts are parsed in the browser, into one shape

Two decisions, made together in
[#4](https://github.com/thekevinscott/telelux/issues/4):

- **Parsing runs in the browser.** One TypeScript parser turns an agent's
  raw transcript file into the shape the element renders. The Python package
  never parses: it reads the file and hands the bytes over. A structural test
  in `packages/python/telelux/src/telelux/__init___test.py` keeps `json` out
  of the package so the rule cannot erode one helper at a time.
- **The shape is the element's `Transcript`.** Anything an agent's format
  carries beyond it goes in `metadata`, never in new roles or content types,
  so the element's input contract has one definition.

**Where the parser lives.** It is a module inside `telelux-element`, exposed
Lit-free through the `telelux-element/parse` subpath export and re-exported
from the main entry. It was not put in `packages/node/telelux` (that package
would have to build before the element and own the schema the element
validates against) and not given a package of its own (a putitoutthere
entry, a CI lane, and path globs for one module). Move it out when a second
consumer needs it without the element.

**The corpus is shared.** `fixtures/claude-code/sample.jsonl` at the repo
root is the one sample every package tests against, with the reference
output in `sample.transcript.json` beside it. Both package lanes list
`fixtures/**` in their `paths:` filter. Regenerate the reference from a
rebuilt `dist/parse.js` when parser semantics change, and review the diff by
hand; it is the record of what the parser means.

**Limits.** 50 MiB of text and 100,000 records. Past either the parser
returns an error, never a truncated transcript. Malformed lines are kept
verbatim as `system` messages flagged `raw`. The Python package never parses,
so it enforces only the byte limit: `load_data` reads at most 50 MiB plus one
byte and raises `ValueError` past it.

## Hosting and the canonical URL

Decided in [#23](https://github.com/thekevinscott/telelux/issues/23):

- **The viewer is canonical at `https://telelux.dev/`.** The built
  `dist/viewer.html` is served at the root, so every generated link has the
  shortest form, `https://telelux.dev/#v=1&data=<value>`. The 8,000-character
  link budget is the reason the viewer takes the root and not a subpath.
- **The docs live at `https://docs.telelux.dev/`.**
- **The viewer is on GitHub Pages; the docs are on Netlify.** Two separate
  sites. `.github/workflows/viewer-pages.yml` builds `telelux-web` and deploys
  it to Pages on every push to `main` that touches `telelux-web`,
  `telelux-element`, or the root workspace and lockfile. Pages cannot rewrite,
  so the workflow copies `dist/viewer.html` to `index.html` in the artifact;
  the served page is byte-for-byte what the wheel ships. On PRs the same
  workflow builds and stages the artifact without deploying. The custom domain
  comes from the repo's Pages settings, not from a `CNAME` file, which Pages
  ignores for workflow deploys.
- **The docs site is configured by the root `netlify.toml`.** Its `ignore`
  command mirrors the `paths:` filter in `.github/workflows/docs.yml`, so it
  builds only when its inputs change. Keep the two in step when they move.

The canonical URL is defined once, as `LINK_PREFIX`
(`https://telelux.dev/#v=1&data=`) in the Python package's
`src/telelux/build_link.py`; nothing else spells it out.

**The link format is pinned by a shared vector.** `fixtures/link/v1.json` holds
one transcript text, its gzip bytes, and its `#v=1&data=` payload. The Python
encoder must produce that payload exactly. telelux-web's base64url and gunzip
unit tests decode it back, and its integration tier renders it. Change the
format only together with a new envelope version and a new vector.
