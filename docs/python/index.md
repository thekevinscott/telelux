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

## Your first view

<!-- Smallest end-to-end example that runs successfully. Filled in when the
SDK lands (see the sdk epic). -->

```python
from telelux import Telelux

viewer = Telelux(transcript="path/to/transcript.jsonl")
viewer.write("transcript.html")
```
