---
diataxis: tutorial
---

# Web component

`<telelux-transcript>` renders an agent transcript in the browser.

## Install

```sh
pnpm add telelux-element
```

```html
<script type="module">
  import 'telelux-element';
</script>

<telelux-transcript></telelux-transcript>

<script type="module">
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

The `transcript` property takes a `Transcript` object. The package README
documents the input in full, including the `annotations` property's sidecar
format for review marks and timeline events.

## Review annotations

Give the element a sidecar of annotations and each one appears under the
block it points at:

```html
<script type="module">
  document.querySelector('telelux-transcript').annotations = {
    version: 1,
    annotations: [
      {
        id: 'tz',
        target: { start: { index: 1 } },
        label: 'unverified-claim',
        note: 'The answer never checked a clock.',
        source: { kind: 'judge' },
      },
    ],
  };
</script>
```

A card with the label `unverified-claim` appears under the assistant's
answer. Type your name in the Reviewer field, press Confirm on the card, and
the card reads `Confirmed by` your name. Press Download annotations to save
the sidecar with your decision in it.

See it running on the [demo](./demo) page.
