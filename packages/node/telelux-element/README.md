# telelux-element

Web component that renders an agent transcript.

## Install

```sh
pnpm add telelux-element
```

```html
<script type="module">
  import 'telelux-element';
</script>

<telelux-transcript></telelux-transcript>
```

`lit` is a regular dependency, resolved by the host's package manager rather
than bundled into `dist/index.js`.

Currently a scaffold: the tag renders the placeholder text "hello world".
Transcript rendering lands in later work under
[#49](https://github.com/thekevinscott/telelux/issues/49).

### Without a bundler

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://esm.sh/lit@3",
      "telelux-element": "https://esm.sh/telelux-element@0"
    }
  }
</script>
<script type="module">
  import 'telelux-element';
</script>

<telelux-transcript></telelux-transcript>
```

The import map must appear in the host page before any module script that
imports `lit` or `telelux-element`. No build step is involved — the browser resolves
both bare specifiers straight from esm.sh.

## Testing

Two tiers:

- **Unit** — `pnpm test_unit` (Vitest, jsdom, colocated `src/*.test.ts`).
- **Integration** — `pnpm test_integration` (Playwright, a built page in a
  real browser).
