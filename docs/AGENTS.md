# Docs — agent contract

One VitePress site documents all three packages: the web component
(`packages/node/telelux-element`), the app shell, and the Python CLI/SDK
(`packages/python/telelux`). Netlify hosts it from `docs/.vitepress/dist`, built by
the root `netlify.toml`; `.github/workflows/docs.yml` runs the same build as a
PR check and deploys nothing. GitHub Pages belongs to the app shell alone.

## Layout

The site is deliberately small: a blank homepage, one Getting Started page
per package, and a Demo page for the web component. Do not add pages,
quadrant trees, or sidebar groups without an issue asking for them.

| Page | Package |
| --- | --- |
| `index.md` | homepage: a plain page with one link |
| `component/index.md` | web component |
| `component/demo.md` | web component, hosts the live `<telelux-transcript>` demo |
| `app/index.md` | app shell |
| `python/index.md` | Python CLI/SDK |

`.vitepress/config.ts` declares one global sidebar keyed on `/` with one group
or entry per package. Do not add path-scoped sidebars: they swap the whole tree out and
hide the other packages.

Package READMEs are the reference for each package's surface. The site does
not copy or include them.

## The live demo

`/component/demo` renders the element built from this branch's source, not from
npm. The root `pnpm-workspace.yaml` links `docs` to `packages/node/telelux-element`
through `telelux-element: workspace:*`, so the component must be built before the
docs (`pnpm --filter telelux-element build`, then `pnpm --filter docs build`).
`config.ts` registers `telelux-transcript` as a custom element for the Vue compiler,
and `.vitepress/theme/TranscriptDemo.vue` imports `telelux-element` inside
`onMounted` because Lit touches `window` at import time. Fixtures live in
`public/fixtures/`.

## Diataxis

Each Getting Started page, and the Demo, is a [Diataxis](https://diataxis.fr)
tutorial and declares `diataxis: tutorial` in frontmatter. The homepage is exempt. If the
site grows past this shape, keep one mode per page and declare the quadrant
in frontmatter (`tutorial | how-to | reference | explanation`).

`internals/` is contributor/agent-facing material excluded from the build via
`srcExclude` in `.vitepress/config.ts`. Package-local changelog and migration
folders are outside the docs site entirely.
