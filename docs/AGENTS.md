# Docs — agent contract

One VitePress site documents all three packages: the web component
(`packages/component`), the app shell, and the Python CLI/SDK
(`packages/python`). Netlify hosts it from `docs/.vitepress/dist`, built by
the root `netlify.toml`; `.github/workflows/docs.yml` runs the same build as a
PR check and deploys nothing. GitHub Pages belongs to the app shell alone.

## Package-first layout

The nav and sidebar are organized by package, not by quadrant. A reader wants
one package's docs, not one quadrant across all three.

| Tree | Package | Entry page |
| --- | --- | --- |
| `component/` | web component | `/component/` — hosts the live `<tele-lux>` demo |
| `app/` | app shell | `/app/` |
| `python/` | Python CLI/SDK | `/python/` |

Inside each tree the four [Diataxis](https://diataxis.fr) groups repeat:
`index.md` is the tutorial, then `guide/`, `reference/`, `explanation/`.
`migrations.md` at the root is reference shared by every package. A
`contributing/` tree holds repo-wide how-tos that belong to no package.

`.vitepress/config.ts` declares one global sidebar keyed on `/` with a
top-level group per package. Do not add path-scoped sidebars: they swap the
whole tree out and hide the other packages.

## Package READMEs are the reference source

Each package's `README.md` is the source of truth for its surface, and the
package's `reference/index.md` includes it rather than copying it:

```md
<!--@include: ../../../packages/component/README.md-->
```

Edit the README, never the docs copy. Treat the Python README the same way
when that tree gains content.

## The live demo

`/component/` renders the element built from this branch's source, not from
npm. The root `pnpm-workspace.yaml` links `docs` to `packages/component`
through `telelux: workspace:*`, so the component must be built before the
docs (`pnpm --filter telelux build`, then `pnpm --filter docs build`).
`config.ts` registers `tele-lux` as a custom element for the Vue compiler,
and `.vitepress/theme/TranscriptDemo.vue` imports `telelux` inside
`onMounted` because Lit touches `window` at import time. Fixtures live in
`public/fixtures/`.

## The four quadrants

Every page is exactly one of four kinds, and that kind is **declared, not
implied**. Skim the [compass](https://diataxis.fr/compass/) before adding or
moving a page.

| Quadrant | Orientation | A page here is… | …and is **not** |
| --- | --- | --- | --- |
| **Tutorial** | learning | a lesson that walks a beginner through a guaranteed-to-succeed first run | a menu of options, an API dump, or the "why" |
| **How-to** | tasks | a recipe that solves one real problem for someone who knows the basics | a teaching exercise or a complete reference |
| **Reference** | information | a dry, complete description of the API / config / CLI surface | a tutorial, an opinion, or task framing |
| **Explanation** | understanding | discursive background: why it works this way, trade-offs, alternatives | step-by-step instructions or exhaustive parameter tables |

Not everything under `docs/` is a quadrant: `internals/` is contributor/agent-
facing material excluded from the build via `srcExclude` in
`.vitepress/config.ts`. Package-local changelog and migration folders are
outside the docs site entirely.

The cardinal rule: **one mode per page.** When a how-to sprouts an
"understanding" tangent, that paragraph belongs in `explanation/` behind a
link, not inline.

## Local rules

1. **Answer _why_ first.** Open every page by telling the reader why they're
   here. If a page can't justify itself in a sentence, merge or cut it.
2. **Build toward resolution.** Every page ends by pointing to the next step.
3. **Declare the quadrant in frontmatter.** Every content page carries
   `diataxis: tutorial | how-to | reference | explanation`. The home page
   (`index.md`, a plain page with one link) is exempt.
4. **One mode per page.**
5. **Register the page** under its package's group in `.vitepress/config.ts`,
   inside the right quadrant entry.

## Enforcement (optional)

The `diataxis:` key makes a gate a few lines of bash: assert every
`docs/**/*.md` except the home page and `internals/` declares a valid quadrant.
It is deliberately not wired in.
