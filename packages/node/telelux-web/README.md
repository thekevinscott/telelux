# telelux frontend (internal)

Internal TypeScript workspace for the static HTML viewer. **Never published to
npm** — the built viewer artifact is bundled into the Python wheel
(`packages/python/telelux`) and served/saved by the Python SDK.

`pnpm build` writes a single file, `dist/viewer.html`. It wraps
`<telelux-transcript>` from `telelux-element` in a small React shell, with every
script and style inlined, so it opens straight from disk with no network.
`build` and `typecheck` build `telelux-element` first, since this package
consumes its `dist/`.

The same file is deployed to `https://telelux.dev/` on GitHub Pages, as
`index.html`, by `.github/workflows/viewer-pages.yml`.

Source lives in `src/` with colocated `*.test.tsx` unit tests (Vitest);
`tests/integration` drives the built file in Playwright.
