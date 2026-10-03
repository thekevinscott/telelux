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

## Baked-in transcript slot

`dist/viewer.html` ships one empty slot at the end of `<body>`:

```html
<script type="application/x-ndjson" id="transcript"></script>
```

To bake a transcript into a copy of the page, put the file's text inside that
element with `&`, `<`, and `>` written as `&amp;`, `&lt;`, and `&gt;` (Python's
`html.escape(text, quote=False)`). Nothing else is escaped. The escaping keeps
transcript text from closing the element or opening a comment inside it. On
load, a page whose fragment is empty unescapes the slot's text in one pass and
renders it; any `#v=1&data=` fragment takes precedence. The viewer's
**Download standalone HTML** button bakes the same way.

## Baked-in annotations slot

Next to it, `dist/viewer.html` ships an empty annotations slot:

```html
<script type="application/json" id="annotations"></script>
```

To bake an annotations sidecar (the `parseAnnotations` format from
`telelux-element`) into a page that also has a baked transcript, put its JSON
text in this slot, escaped exactly like the transcript slot. The viewer reads
it only when it renders the baked transcript: a page with a `#v=1&data=`
fragment ignores it, and so does a page whose transcript slot is empty. JSON
the viewer cannot read, or that does not match the format, is reported above
the transcript, which still renders. **Download standalone HTML** empties this
slot, since its annotations belong to the transcript being replaced.

Annotations a user opens with **Open an annotations file** replace the baked
ones for as long as the same transcript is shown.
