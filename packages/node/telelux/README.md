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

## Testing

Run `pnpm test_unit` for the colocated Vitest suite.
