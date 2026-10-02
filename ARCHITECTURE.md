# Architecture

telelux is a web component, an app shell around it, and a Python SDK and
CLI. `putitoutthere.toml` publishes three packages: PyPI `telelux`, npm
`telelux-element`, and npm `telelux`, which is a placeholder for now. The app
shell, `telelux-web`, is private. It is deployed to GitHub Pages rather than
published.

## Packages

```
packages/
  python/
    telelux/          hatchling-built wheel — the SDK and CLI. PyPI `telelux`.
  node/
    telelux/          Node tooling; a placeholder until it wraps (or is wrapped by) the Python package. npm `telelux`.
    telelux-element/  the `<telelux-transcript>` web component. npm `telelux-element`.
    telelux-web/      the app shell, built to a single dist/viewer.html. Private, never published; served at https://telelux.dev/ by GitHub Pages.
docs/        VitePress site (published to https://docs.telelux.dev/ by Netlify).
  internals/ contributor + agent conventions (not published).
```

## Offline packaging

The viewer is a single self-contained HTML file, `dist/viewer.html`. The plan
([#6](https://github.com/thekevinscott/telelux/issues/6)) is to ship it inside
the wheel, so that rendering a transcript needs no Node, no browser
automation, and no network at runtime. The SDK reads the bundled asset,
injects the transcript text into its baked-in slot, and writes or serves the
result. Until #6 lands, the wheel carries no viewer.

## Release flow

`putitoutthere.toml` declares three packages: `telelux-pypi` (PyPI
`telelux`), `telelux-element-npm` (npm `telelux-element`), and `telelux-npm`
(npm `telelux`). Each npm package is tagged `<name>-v{version}`. The `Release`
workflow (`.github/workflows/release.yml`) calls the reusable workflow at
`thekevinscott/putitoutthere`; the PyPI upload runs in this repo's workflow
context so Trusted Publishing claims line up (see the comments in that file).

## CI gates

- Per-package lanes (`python-telelux.yml`, `node-telelux-element.yml`, `node-telelux-web.yml`) run lint + typecheck + test + build with path filters.
- `viewer-pages.yml` builds and stages the viewer on PRs and deploys it to GitHub Pages on `main`.
- Each lane's `conventions` job runs the
  [testing-conventions](https://github.com/thekevinscott/testing-conventions)
  standard on that package. It names no `gates:`, which
  means the full default set: colocated tests and their co-change rule,
  one-function-per-file, unit-test mocking hygiene, integration-test layout,
  whole-tree and changed-line coverage, diff-scoped mutation, and packaging
  (no test files in the built artifact). `e2e verify` is wired but inert —
  it wants committed receipts under `e2e-attestations/` and there are none,
  because e2e does not run in CI. Narrow a rule through a `reason`-carrying
  exemption in `packages/<lang>/<pkg>/testing-conventions.toml`, never by adding a
  `gates:` allowlist: an exemption is scoped and goes stale loudly, an
  allowlist is silent forever.
- `check.yml` / `build-check.yml` validate `putitoutthere.toml` and the release build on every PR.
- `docs.yml` builds + deploys the VitePress site.
- `pr-monitor.yml` gates merge on the aggregate CI status.

## Public-API surface

Defined in `docs/internals/repo.md`: every exported value/type, every CLI
flag, every config key, every observable artifact. Changes to that surface
require a fragment under `packages/<lang>/<pkg>/changelog.d/` (plus the package's
`migrations.d/` when breaking).
