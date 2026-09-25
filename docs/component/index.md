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

The `transcript` property takes docent's transcript shape. The package README
documents the input in full.

See it running on the [demo](./demo) page.
