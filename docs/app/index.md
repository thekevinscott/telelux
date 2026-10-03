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

## Annotations

Once a transcript is showing, choose **Open an annotations file** above it and
pick an annotations sidecar, the JSON file a judge or a reviewer writes for that
transcript. The [web component](/component/) page describes its format. Each
annotation appears as a card under the block it points at, with the panel of
filters and the timeline above the transcript. The file never leaves your
browser, and nothing about it is stored.

Open another annotations file and it replaces the first. Open another
transcript and the annotations go with the old one. If the file is not JSON,
or its JSON is not an annotations sidecar, the viewer says so, lists what does
not match, and keeps showing whatever annotations it showed before.

Your Confirm and Reject decisions live only in the page. Press **Download
annotations** to save the sidecar with them in it.

A link carries only a transcript, never its annotations. A page with a
transcript baked in can carry annotations too, and shows them with that
transcript. A link opened on such a page shows its own transcript without
them.

## Theme

Open the viewer and pick a theme from the **Theme** menu at the top right:

- **Paper** is the default: warm off-white, for reading.
- **Cool** is a light blue-grey.
- **Dark** is the web component's own dark theme.

The transcript restyles as soon as you choose. Nothing reloads, and your place
in the transcript stays put.

Reload the page and the viewer opens on the theme you chose last. It keeps that
choice in your browser's `localStorage` under `telelux-theme`, and stores only
the theme name, never any transcript content. If the browser blocks storage,
as some private-browsing modes do, the theme still switches; the viewer forgets
it when you close the page.
