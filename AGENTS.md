# Agent contract

This file is the operating contract for AI agents working in this repo.
Conventions, supervision rules, and per-language style live under
`docs/internals/` — start there before making changes.

## Where to read first

- `docs/internals/repo.md` — cross-cutting rules (changelog/migration fragment philosophy, public-API surface).
- `docs/AGENTS.md` — how the docs site is organized ([Diataxis](https://diataxis.fr)) and the per-page quadrant rule.
- `docs/internals/python/` — Python style, testing, shipping, review, setup.
- `docs/internals/typescript/` — TypeScript style, testing, shipping, review, setup.

## Layout

- **`packages/`** holds public-facing packages — what gets published. It is
  language-first, matching testing-conventions: `packages/python/<pkg>` and
  `packages/node/<pkg>`, each folder named after the package it publishes
  (`packages/python/telelux`, `packages/node/telelux`,
  `packages/node/telelux-element`, `packages/node/telelux-web`). npm `telelux`
  and PyPI `telelux` will expose the same tooling; which wraps which is
  undecided.
- **`internals/`** holds internal-only packages — built and tested to the same
  standard, never published.

A package's directory states which it is. Don't rely on a `private: true` flag
or a `Private :: Do Not Upload` classifier to carry that alone.

## Worktrees

**All work happens in git worktrees under `.worktrees/`.** Never edit files in
the primary checkout; it stays on `main` and clean. `.worktrees/` is
gitignored.

- Create one worktree per branch/PR: `git worktree add .worktrees/<branch> -b <branch>`.
  The worktree directory name and the branch name are **identical** —
  `.worktrees/<branch>` always contains branch `<branch>`.
- Branch names use **dashes only**: lowercase letters, digits, and `-`.
  No slashes, no spaces (e.g., `add-theme-selector`, not `feature/add-theme-selector`).
- Do all editing, building, and testing inside `.worktrees/<branch>/`.
- When the PR merges, remove the worktree: `git worktree remove .worktrees/<branch>`.

## Merging

**Never merge.** Agents open PRs and stop there. Kevin merges through the
GitHub UI as a human.

- Never merge on your own initiative, however green the checks are.
- Never suggest merging, and never offer to merge as a next step.
- The only exception is an explicit, specific instruction from Kevin to merge a
  named PR. That instruction is always his to initiate, and it is rare.

## Comments

**Omit comments.** Zero is the target; as few as possible is the rule. A
comment earns its place only when the reason is not derivable from the code —
a constraint, a workaround, a decision that looks wrong until you know why.
Rationale, never restatement. Never narrate what a line does. Prefer a better
name over a comment explaining a bad one, and prefer deleting a comment over
shortening it.

## Workflow

- Use `just` for local tasks. Each package owns its justfile and you run it
  from that package's root — `packages/python/telelux/justfile` is the Python one
  (`just lint`, `just typecheck`, `just test_unit`). There is no repo-root
  justfile; recipe names use underscores.
- **Each test tier has its own recipe, and there is no aggregate.**
  `test_unit` (colocated, `src/`), `test_integration` (`tests/integration`),
  `test_e2e` (`tests/e2e`). Each has a `_watch` twin backed by
  `pytest-watcher`. Naming a tier explicitly is the point — a bare `pytest`
  collects only `src/`, per `testpaths` in `pyproject.toml`.
- **Every test lives inside a describe block.** Python uses `pytest-describe`
  (`def describe_<subject>():` with `def test_<behavior>():` nested inside);
  TypeScript uses Vitest's `describe()`. A bare top-level test function is not
  acceptable, in any tier. Note the failure mode: without the `pytest-describe`
  plugin installed, a `describe_` block collects **zero** tests and pytest
  reports success — a missing plugin looks exactly like a passing suite.
- The [testing-conventions](https://github.com/thekevinscott/testing-conventions)
  standard applies **in full**, run by the `conventions` job of each package lane under `.github/workflows/`.
  Colocated unit tests (`foo.py` ↔ `foo_test.py`, `foo.ts` ↔ `foo.test.ts`)
  are its most visible rule, not its only one — coverage, diff-scoped
  mutation, mocking hygiene, one-function-per-file, integration-test layout,
  and packaging all gate too. See `ARCHITECTURE.md` for the set. To relax a
  rule, add a `reason`-carrying exemption to that package's
  `testing-conventions.toml`; never add a `gates:` allowlist to the workflow.
- **Repo gates come from external tools, not from a local CI package.**
  putitoutthere, testing-conventions, and pr-monitor own them. A gate this repo
  seems to need for itself is a missing feature upstream — file it there rather
  than writing a bespoke checker here.
- Every PR that changes a public API adds a **changelog fragment**: one
  timestamped file under `packages/<lang>/<pkg>/changelog.d/` (plus one under
  `packages/<lang>/<pkg>/migrations.d/` for breaking changes), named
  `YYYY-MM-DD-<slug>.md` by UTC merge date. A changelog fragment is a
  snippet, one to three lines: a bold Keep a Changelog category, then the
  entry text. A migrations fragment keeps all five headings, with `_None._`
  under those that do not apply. Each folder's README shows one. The folders
  are the permanent, append-only record;
  `packages/<lang>/<pkg>/CHANGELOG.md` / `MIGRATIONS.md` are pointer stubs — never
  append entries to them. For version attribution ("which release shipped X"),
  map fragment dates against tags via `git log --tags`. Bypass with a
  `skip-changelog:` git trailer for genuinely internal refactors. Not gated in
  CI right now — testing-conventions owns this gate and has not exposed it to
  consumers yet (thekevinscott/testing-conventions#642).
- Pre-commit hooks (`pre-commit install --install-hooks` from the repo root)
  gate formatting, gitleaks, and per-language linters.

## E2E

**E2e never runs in CI, and you run it before every major change.** No runner
executes the suite — it is slow, it needs real services, and a fixed amount of
it on every push prices it out of the judgment-driven use it is for. What CI
enforces instead is that a branch touching the code recorded one visible e2e
decision. testing-conventions supplies the pair.

**Before pushing a major change, attest.** From the package root, on the branch
carrying the work:

```sh
testing-conventions e2e attest '<your e2e command>'
```

It streams your command's output, and on success writes and commits
`e2e-attestations/<branch>.json` — the command, a timestamp, the exit code, and
the commit it ran against. On failure it writes nothing and exits with your
command's own exit code, so a red e2e run reads as red. **A receipt therefore
only ever stands for a run that passed**; reaching one means fixing the failure
and attesting again.

**The command is yours to choose, and that choice is the judgment being
recorded.** The full suite, the one suite covering the contract you touched, or
a no-op for a change you judge needs no run — all are valid receipts. The point
is that the question gets asked once, at the moment it applies, and the answer
lands in the diff where review can see it.

**`e2e verify` is the CI half.** It asks two content questions over
`<base>...HEAD`: did this branch change the scoped source, and does its diff add
or update a receipt? It never runs the suite and never reads the recorded
command or exit code. Change the source without attesting and it fails, naming
the fix.

Practical consequences:

- The receipt belongs to the **branch**, not its newest commit. More commits
  after attesting leave the gate green. Re-run `attest` if you judge that later
  work changed the picture; the receipt is overwritten in place.
- Both questions are content questions, so a rebase, a force-push, or a squash
  merge never disturbs a receipt.
- Receipts from merged branches accumulate and are inert. Never delete another
  branch's receipt — pairing a delete with your add makes git read the two as a
  rename and collide.
- A branch that touched none of the scoped source passes trivially.

**Status in this repo: dormant.** There is no e2e suite yet and no receipts, so
the `E2E attestation freshness` job reports as skipping. It arms itself the
moment the first receipt is committed. Write the suite and attest before the
first change that warrants one — don't wait to be told by a red check.

## First-publish prerequisites

Before the first `Release` run on a fresh scaffold:

1. **Repo must be public.** Trusted Publishing on PyPI requires the
   provider to inspect the workflow file at the configured ref; private
   repos cannot satisfy this. The `preflight` job in
   `.github/workflows/release.yml` fails fast if the repo is private.
2. **PyPI Trusted Publisher registered.** Brand-new projects use a
   *pending publisher*: under
   `https://pypi.org/manage/account/publishing/`, register the repo,
   the `release.yml` workflow filename, and the project name
   (`telelux`) before the first release. No long-lived
   tokens are needed at any point — PyPI is the only registry.

## Session handoff doc

Maintain one ongoing handoff doc per session and deliver it to Kevin as a
downloadable markdown file at every stopping point: after each major unit of
work lands (a push, a green CI run, a finished investigation, a merged PR) or
when blocked on his input. A stopping point marks a checkpoint, not the end:
send the doc, then keep working.

- **Keep it in the session scratchpad or `/tmp`** (e.g. `<scratchpad>/handoff.md`).
  It is conversation-scoped: never commit it, stage it, or place it anywhere
  in the repo tree.
- **Update the same doc in place and re-send it at each checkpoint** (in
  hosted sessions, attach it via the file-delivery tool; locally, print its
  path), so the freshest copy sits near the bottom of the conversation.
- **Write it standalone**, so a brand-new session with zero context can resume
  from it alone: task and status (done / in progress / next), branches, PRs
  and issues with numbers and CI state, key decisions and discovered
  constraints with one-line reasons, exact next commands to run, anything
  waiting on Kevin.

## Out of scope

- Don't add unsolicited refactors or hypothetical-future abstractions.
- Don't bypass hooks or CI gates without an explicit reason in the PR body.
