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

Write the viewer, with your transcript baked in, to a file:

```python
viewer.write("transcript.html")
```

Open `transcript.html` in a browser.

The file needs no network and no server. Every script and style sits inside
it, so you can email it, attach it to a ticket, or open it on a plane. Click
**Raw** on any message to see the record the agent wrote.

The transcript inside is plain text, so a message that happens to contain
`</script>` or other markup shows up as text and can't change the page.

`write` never replaces a file. Run it again and it raises `FileExistsError`,
leaving the first file exactly as it was. Choose a new name, or delete the old
file first. If you want the HTML as a string instead, to serve it or attach it
somewhere, use `viewer.html`.

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

## Serve it locally

`viewer.serve()` runs the viewer on your machine:

```python
viewer = Telelux("path/to/transcript.jsonl")
viewer.serve()
```

Open <http://127.0.0.1:8000/> and the transcript is there. Press Ctrl+C to
stop. Any keyword you pass goes straight to
[Uvicorn](https://www.uvicorn.org/settings/), so `viewer.serve(port=9000)` or
`viewer.serve(host="0.0.0.0")` work as they would there.

The server reads the transcript each time the page loads. To show another
transcript, assign it and reload the browser tab:

```python
viewer.transcript = "path/to/other.jsonl"
```

`Telelux().serve()`, with no transcript, opens the viewer on its loading
screen. From there you can open or drop a transcript file, or enter a
transcript's URL. Shared links work too: add their `#v=1&data=…` part to the
local address.

Inside async code, await `serve_async` instead, so the server shares your
event loop rather than blocking it:

```python
await viewer.serve_async(port=9000)
```
