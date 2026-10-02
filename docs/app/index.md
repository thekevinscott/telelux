---
diataxis: tutorial
---

# App

The app shell wraps `<telelux-transcript>` in a single page, `viewer.html`,
that loads a transcript and renders it in the browser. Nothing you load is
sent to a server. The [web component](/component/) page covers the element
itself.

## Loading

A transcript is one JSON-lines file, read as UTF-8. You can load one in four
ways, and each way ends with the same rendered transcript.

### Open a compressed link

A compressed link carries the whole transcript in its fragment:

```
viewer.html#v=1&data=<payload>
```

The payload is the transcript file, gzipped and then base64url-encoded
without padding. Open the link and the transcript renders at once. Nothing is
fetched. Links stay under 8,000 characters, and a payload may decompress to at
most 10 MiB. Back and Forward move between the links you have opened.

### Open a hosted transcript

Put the transcript's address after `data=` instead:

```
viewer.html#v=1&data=https://example.com/transcript.jsonl
```

The viewer fetches that address and shows progress, with a Cancel button,
while the file downloads. Copy the address in as it is: its own `?`, `&`, and
`=` stay part of it. The host must allow cross-origin reads, and the file
must arrive within 30 seconds and stay under 50 MiB. When a fetch fails, the
viewer says why and offers Retry.

### Paste a transcript address

Paste a transcript's address into the viewer's address box and load it. The
viewer turns it into the hosted-transcript link above and opens that, so the
result works exactly like a hosted link, and you can share it the same way.

### Open a local file

Choose **Open a transcript file**, or drop one file anywhere on the page. The
file never leaves your browser. The viewer compresses it into a compressed
link and opens that link, so the address bar now holds a link you can copy
and share.

Some files are too large for a link: the link would pass 8,000 characters, or
the file is over 10 MiB. For those, the viewer keeps showing whatever it
showed before, explains the limit, and offers **Download standalone HTML**.
That downloads a copy of the viewer with your transcript baked in. Open it
from disk and it renders the transcript with no network. A standalone file
still accepts a `#v=1&data=` link, which replaces its baked-in transcript.

Files over 50 MiB or 100,000 records are refused outright.
