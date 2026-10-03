# telelux

Generate and share self-contained, interactive HTML views of agent transcripts.

```bash
pip install telelux
```

The Python SDK is the product. The static viewer it produces is a single HTML
file — no server required to view or share it.

## Python

```python
from telelux import Telelux

viewer = Telelux("transcript.jsonl", annotations="review.json")
```

`Telelux(transcript=None, annotations=None)` reads each path when it is
assigned. `annotations` is an annotations sidecar; Python checks only that it
is JSON, under the same 50 MiB cap as the transcript. `html`, `write` and
`serve` bake it into the viewer's annotations slot. `url` raises `ValueError`
while annotations are set, since a `#v=1` link carries only the transcript.

## Command line

```
telelux [TRANSCRIPT] [--no-browser] [--host HOST] [--port PORT]
telelux TRANSCRIPT --out FILE
telelux TRANSCRIPT --url
telelux TRANSCRIPT --annotations JSON [--out FILE]
```

| Invocation | Result |
| --- | --- |
| `telelux` | Serves the empty viewer through Uvicorn and opens it in a browser. |
| `telelux TRANSCRIPT` | Serves the viewer with `TRANSCRIPT` loaded. |
| `telelux TRANSCRIPT --out FILE` | Writes `Telelux.html` to `FILE` and prints `FILE`. An existing `FILE` is left untouched and the command exits `1`. |
| `telelux TRANSCRIPT --url` | Prints `Telelux.url`, a `https://telelux.dev/#v=1&data=` link, as one line. A link over 8,000 characters exits `1`. |
| `--annotations JSON` | Bakes the annotations sidecar at `JSON` in with the transcript, served or written with `--out`. The file must be JSON; the viewer checks the sidecar format. |
| `--no-browser` | Serves without opening a browser. |
| `--host`, `--port` | Forwarded to Uvicorn, which owns their defaults (`127.0.0.1`, `8000`) and validation. |

Exit status is `0` on success, `1` when a file can't be read or written, an
annotations file isn't JSON, or a link would be too long, and `2` for a usage
error, including `--out`, `--url` or `--annotations` without a transcript,
`--out` with `--url`, or `--annotations` with `--url`. Errors and server logs go to stderr.
