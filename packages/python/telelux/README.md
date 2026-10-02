# telelux

Generate and share self-contained, interactive HTML views of agent transcripts.

```bash
pip install telelux
```

The Python SDK is the product. The static viewer it produces is a single HTML
file — no server required to view or share it.

## Command line

```
telelux [TRANSCRIPT] [--no-browser] [--host HOST] [--port PORT]
telelux TRANSCRIPT --out FILE
```

| Invocation | Result |
| --- | --- |
| `telelux` | Serves the empty viewer through Uvicorn and opens it in a browser. |
| `telelux TRANSCRIPT` | Serves the viewer with `TRANSCRIPT` loaded. |
| `telelux TRANSCRIPT --out FILE` | Writes `Telelux.html` to `FILE` and prints `FILE`. An existing `FILE` is left untouched and the command exits `1`. |
| `--no-browser` | Serves without opening a browser. |
| `--host`, `--port` | Forwarded to Uvicorn, which owns their defaults (`127.0.0.1`, `8000`) and validation. |

Exit status is `0` on success, `1` when a file can't be read or written, and `2` for a
usage error. Errors and server logs go to stderr.
