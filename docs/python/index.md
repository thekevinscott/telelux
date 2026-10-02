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

## Show annotations

An annotations file is the JSON sidecar a judge or a reviewer writes for a
transcript, in the format the [component guide](../component/index.md#review-annotations)
shows. Pass its path as `annotations`, next to the transcript:

```python
viewer = Telelux("path/to/transcript.jsonl", annotations="path/to/review.json")
viewer.write("reviewed.html")
```

Open `reviewed.html` and each annotation sits under the block it points at.
`viewer.html`, `viewer.write()` and `viewer.serve()` all carry the
annotations along with the transcript.

Annotations behave like the transcript. `Telelux` reads the file as soon as
you give it, so assign the path again to pick up changes, and assign `None` to
drop them:

```python
viewer.annotations = "path/to/review.json"
viewer.annotations = None
```

A file that isn't JSON raises a `ValueError` naming it, and
`viewer.annotations` keeps what it held before. So do a folder, a file that
isn't UTF-8, and a file over 50 MiB. A missing file raises
`FileNotFoundError`. Python only checks that the file is JSON. If the JSON
isn't an annotations sidecar, the viewer says so above the transcript and
still shows the transcript.

A link has no room for annotations. While they're set, `viewer.url` raises a
`ValueError` rather than share the transcript without them. Set
`viewer.annotations = None` first if you want the bare link.

## From the command line

Installing the package also installs a `telelux` command. Everything above
works from your shell too.

### Open a transcript

Point `telelux` at a transcript:

```sh
telelux path/to/transcript.jsonl
```

It starts the viewer on <http://127.0.0.1:8000/> and opens it in your browser,
with the transcript already showing. Press Ctrl+C to stop.

Run `telelux` on its own and the viewer opens on its loading screen instead,
ready for a file, a dropped transcript, or a transcript URL.

To start the server without opening a browser, add `--no-browser`. To choose
the address, pass `--host` and `--port`. Uvicorn picks the defaults and checks
the values, as it does for `viewer.serve()`:

```sh
telelux path/to/transcript.jsonl --no-browser --port 9000
```

Server logs go to stderr, so nothing from serving lands in a pipe.

### Export a single HTML file

Add `--out` to write the viewer, with the transcript baked in, to a file
instead of serving it:

```sh
telelux path/to/transcript.jsonl --out transcript.html
```

It prints `transcript.html` and nothing else, so you can hand the path
straight to another command. The file is the same one `viewer.write()`
produces, and opens in a browser with no network and no server.

Like `viewer.write()`, `--out` never replaces a file. If `transcript.html`
already exists, `telelux` leaves it alone and exits with status `1`:

```console
$ telelux path/to/transcript.jsonl --out transcript.html
Error: transcript.html: File exists
```

`--out` needs a transcript. Without one, it's a usage error and exits with
status `2`.

### Share a link

Add `--url` to print a link instead:

```sh
telelux path/to/transcript.jsonl --url
```

It prints one line, the same link as `viewer.url`, and nothing else. That makes
it easy to pipe, for example to your clipboard:

```sh
telelux path/to/transcript.jsonl --url | pbcopy
```

The limits are the same as for `viewer.url`. A transcript too long for a link
exits with status `1`, and the message gives the size, the limit, and the two
alternatives: `--out`, or hosting the `.jsonl` file yourself. `--url` needs a
transcript, and it can't be combined with `--out`. Either mistake is a usage
error and exits with status `2`.

### Add annotations

Add `--annotations` to show an annotations file with the transcript, whether
you serve it or export it with `--out`:

```sh
telelux path/to/transcript.jsonl --annotations path/to/review.json
telelux path/to/transcript.jsonl --annotations path/to/review.json --out reviewed.html
```

A file that can't be read, or isn't JSON, exits with status `1` and names the
file:

```console
$ telelux path/to/transcript.jsonl --annotations notes.txt
Error: notes.txt is not valid JSON: Expecting value: line 1 column 1 (char 0)
```

`--annotations` needs a transcript, and a link can't carry annotations, so it
can't be combined with `--url`. Either mistake is a usage error and exits with
status `2`.

### When something goes wrong

`telelux` prints problems to stderr, prefixed with `Error:`, and nothing to
stdout. Problems with the files you named exit with status `1`:

```console
$ telelux missing.jsonl
Error: missing.jsonl: No such file or directory
```

A folder, a file that isn't UTF-8, and a file over 50 MiB fail the same way,
each with its own message. A mistyped command, such as an unknown option,
exits with status `2` and shows the usage line.
