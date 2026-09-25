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

Assign a transcript to the element's `transcript` property:

```html
<telelux-transcript></telelux-transcript>

<script type="module">
  import 'telelux-element';

  document.querySelector('telelux-transcript').transcript = {
    id: 'demo',
    metadata: {},
    messages: [
      { role: 'user', content: 'What time is it in Tokyo?' },
      { role: 'assistant', content: 'It is 4 pm in Tokyo.' },
    ],
  };
</script>
```

Rendering is a placeholder list of messages for now. Block rendering with
docent parity lands in later work under
[#49](https://github.com/thekevinscott/telelux/issues/49).

## Input

`transcript` is a property, not an attribute. It takes a transcript in
[docent](https://github.com/TransluceAI/docent)'s shape, as its
`transcriptTypes.ts` defines it:

```ts
interface Transcript {
  id: string;
  name?: string | null;
  created_at?: string | null;
  transcript_group_id?: string | null;
  messages: ChatMessage[];
  metadata: Metadata;
}
```

Each `ChatMessage` has a `role` of `system`, `user`, `assistant`, or `tool`,
`content` as a string or an array of `Content` items (`text`, `image`,
`reasoning`), and optional `metadata`. Assistant messages may carry
`tool_calls` (`id`, `function`, `type`, `arguments?`, `view?`). Tool messages
may carry `tool_call_id`, `function`, and `error` (`type`, `message`).
`Metadata` is a string-keyed map of primitives, arrays of primitives, or one
further level of the same.

The package exports `Transcript`, `ChatMessage`, `ToolCall`, `Content`, and
`Metadata` as types:

```ts
import type { Transcript } from 'telelux-element';
```

Anything beyond docent's shape lives in `metadata`, so a docent transcript is
always valid input and keys the element does not know about pass through
untouched.

### States

- **Unset** (`undefined` or `null`), or a transcript with no messages: an
  empty state.
- **Invalid**: a value that fails the runtime check renders an error state
  naming the failing path. The element never throws.
- **Valid**: one item per message.

Setting the property again re-renders. All transcript text lands in the DOM
through Lit templates, so nothing in a transcript is interpreted as HTML.

### Annotations

`annotations` is a second property, accepted and stored but not rendered yet.
It reserves room for the annotation sidecar in
[#40](https://github.com/thekevinscott/telelux/issues/40).

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
