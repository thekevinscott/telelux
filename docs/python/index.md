---
diataxis: tutorial
---

# Python

Telelux turns an agent transcript into a single interactive
HTML file. Install the Python package, point it at a transcript, and open the
result in any browser.

## Install

```sh
pip install telelux
```

The package carries the viewer with it, so nothing else needs installing and
nothing below needs a network connection.

## Load a transcript

Hand `Telelux` the path to a transcript, a `.jsonl` file your agent wrote:

```python
from telelux import Telelux

viewer = Telelux("path/to/transcript.jsonl")
print(viewer.transcript)
```

`Telelux` reads the file the moment you give it one, so what you build from
`viewer` shows the transcript as it was then, even if the agent keeps writing
to the file. To pick up newer lines, assign the path again:

```python
viewer.transcript = "path/to/transcript.jsonl"
```

If the file can't be used, nothing changes. Try a folder instead of a file:

```python
viewer.transcript = "path/to"
```

That raises a `ValueError` naming the problem, and `viewer.transcript` still
holds the file from before. A missing file raises `FileNotFoundError`, a file
that isn't UTF-8 raises `UnicodeDecodeError`, and a file over 50 MiB raises a
`ValueError` giving its size and the limit.

To empty the viewer, assign `None`:

```python
viewer.transcript = None
```

## Export a single HTML file

`viewer.html` is the whole viewer with your transcript baked in, as one string.
Save it and open the file in a browser:

```python
from pathlib import Path

Path("transcript.html").write_text(viewer.html, encoding="utf-8")
```

The file needs no network and no server. Every script and style sits inside
it, so you can email it, attach it to a ticket, or open it on a plane. Click
**Raw** on any message to see the record the agent wrote.

The transcript inside is plain text, so a message that happens to contain
`</script>` or other markup shows up as text and can't change the page.

## Share a link

`viewer.url` packs the whole transcript into a link to the hosted viewer:

```python
viewer = Telelux("path/to/transcript.jsonl")
print(viewer.url)
```

It prints something like `https://telelux.dev/#v=1&data=H4sIAAAA…`. Paste that
anywhere, and whoever opens it sees the transcript. The transcript travels in
the part after `#`, which browsers never send to the server, so telelux.dev
never receives it.

A link holds a short session. Past 8,000 characters, or 10 MiB of
transcript, `viewer.url` raises a `ValueError` that gives the size, the limit,
and the two ways to share a long transcript instead:

- Export it as a single HTML file.
- Host the `.jsonl` file yourself and share
  `https://telelux.dev/#v=1&data=<transcript-url>`.

With no transcript loaded, `viewer.url` raises `ValueError("No transcript set")`.
