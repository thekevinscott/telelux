# Telelux

Generate and share self-contained, interactive HTML views of agent transcripts.

Open a transcript at [telelux.dev](https://telelux.dev/), or read the
[docs](https://docs.telelux.dev/).

| Package | Install | What it does |
|---|---|---|
| [`telelux`](packages/python/telelux) (PyPI) | `pip install telelux` | Python SDK and CLI. Turns a transcript into a single HTML file, a telelux.dev link, or a local server. |
| [`telelux-element`](packages/node/telelux-element) (npm) | `npm install telelux-element` | The `<telelux-transcript>` web component, plus a parser for raw transcripts. |
| [`telelux`](packages/node/telelux) (npm) | | Node SDK and CLI mirroring the Python package. Not built yet ([#112](https://github.com/thekevinscott/telelux/issues/112)). |

The viewer app itself lives in [`packages/node/telelux-web`](packages/node/telelux-web).
It is never published: it deploys to telelux.dev, and each SDK ships its built
`viewer.html`.

## Development

This repo was scaffolded from
[`template-lib`](https://github.com/thekevinscott/template-lib) and keeps its
conventions: colocated unit tests, changelog fragments, `putitoutthere` for
releases, `just` for contributor commands.

- `cd packages/python/telelux && just lint typecheck test_unit build` — the Python
  gate suite. Each package owns its justfile; there is no repo-root one.
- [ARCHITECTURE.md](ARCHITECTURE.md) — package layout and release flow.
- `docs/internals/` — contributor/agent conventions (not published).
