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
