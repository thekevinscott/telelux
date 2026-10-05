# telelux

Node SDK for viewing agent transcripts. Requires Node 22 or later.

## Install

```sh
pnpm add telelux
```

```ts
import { Telelux } from 'telelux';

const viewer = new Telelux('session.jsonl');
viewer.write('session.html');
console.log(viewer.url);
```

`transcript` and `annotations` accept file paths and snapshot their UTF-8 contents when assigned. Both are limited to 50 MiB. `html` embeds the transcript and optional annotations into the single-file viewer; `write()` creates an HTML file and refuses to overwrite. `url` creates a shareable compressed link and rejects annotations or oversized links. Without a transcript, `html`, `url`, and `write()` throw.

The single-file viewer is available as `telelux/viewer.html` for self-hosting.

## CLI

```sh
telelux session.jsonl
telelux session.jsonl --out session.html
telelux session.jsonl --url
telelux session.jsonl --annotations review.json --out reviewed.html
```

Without a transcript, `telelux` serves the empty viewer. Serving defaults to `127.0.0.1:8000`; use `--host` and `--port` to change it, or `--no-browser` to leave opening the page to you. `--out` and `--url` are exclusive and require a transcript. `--url` cannot carry annotations.

## Testing

Run `pnpm test_unit` for the colocated Vitest suite.
