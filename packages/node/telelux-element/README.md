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

### Slotted raw input

The default slot takes a transcript in the raw format the agent wrote it in.
The element parses it with the parser below, so a static page needs no script
beyond the element import:

```html
<telelux-transcript format="claude-code">
  <script type="text/plain">{"type":"user","message":{"content":"hi"},"uuid":"u1"}
{"type":"assistant","message":{"id":"m1","content":"hello"},"uuid":"a1"}</script>
</telelux-transcript>
```

Wrap the text in a `<script>` with a non-executable type. The browser then
keeps it verbatim: no entity decoding, no whitespace collapsing, no element
parsing. Bare text works too, but the HTML parser gets to it first, so
`&amp;` becomes `&` and a stray `<` can swallow the rest of a line.

- `format` names the parser (`claude-code` today). Unset, the parser sniffs
  the first line.
- The slot is read when the element connects and again whenever its assigned
  nodes change. Replacing the child re-parses; editing text inside the
  existing child does not.
- The `transcript` property wins when both are set, and clearing it falls
  back to the slot.
- A slot that fails to parse renders the error state with the parser's
  message. Lines the parser tolerates show up as raw `system` messages.

### Annotations

`annotations` is a second property, accepted and stored but not rendered yet.
It reserves room for the annotation sidecar in
[#40](https://github.com/thekevinscott/telelux/issues/40).

## Parsing raw transcripts

The package also parses an agent's own transcript file into that shape, in
the browser, with no server round trip. `parseRawTranscript` takes the file's
text and returns a `ParseResult`: `{ ok: true, transcript }` or
`{ ok: false, error }`. It never throws.

```ts
import { parseRawTranscript } from 'telelux-element/parse';

const result = parseRawTranscript(await file.text());
if (result.ok) element.transcript = result.transcript;
```

The `telelux-element/parse` entry pulls in no Lit and registers no element,
so a page can parse without rendering. The main entry re-exports the same
function.

The only format today is `claude-code`: Claude Code's session JSONL. The
format is sniffed from the first line; pass `{ format: 'claude-code' }` to
skip the sniff. An unknown or undetectable format is an error naming the
known formats. `Format` is exported as the union of known names and
`ParseRawOptions` as the options type.

What the parser does with a Claude Code session:

- One `ChatMessage` per record, in file order. User prompts and queued
  prompts become `user` messages; each `tool_result` block becomes its own
  `tool` message with `tool_call_id`, `function` (resolved from the earlier
  `tool_use`), and `error` when the result was an error; everything else
  (attachments, system events, the final `result`, titles, unknown record
  types) becomes a `system` message with a one-line summary.
- Assistant records that share a `message.id` and sit next to each other
  merge into one `assistant` message: `thinking` blocks become `reasoning`
  items, `tool_use` blocks become `tool_calls`, and the usage counts once.
- Every record's `type`, `uuid`, and `timestamp` land in the message
  `metadata`; the transcript `metadata` carries `format`, `sessionId`,
  `cwd`, `version`, `gitBranch`, the record count, and the summed usage.
- A line that is not a JSON object is kept verbatim as a `system` message
  with `metadata.raw: true`. Blank lines are skipped. Nothing is dropped.
- Text over 50 MiB or more than 100,000 records is an error rather than a
  truncated transcript.

The reference corpus lives at `fixtures/claude-code/` in the repo:
`sample.jsonl` and the `sample.transcript.json` it parses to.

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
