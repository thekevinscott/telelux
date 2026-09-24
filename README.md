# Telelux

Generate and share self-contained, interactive HTML views of agent transcripts.

```bash
pip install telelux
```

The Python SDK is the product: point it at a transcript, get back a single
static HTML file you can save, share, or serve — no server required to view
it.

## Development

This repo was scaffolded from
[`template-lib`](https://github.com/thekevinscott/template-lib) and keeps its
conventions: colocated unit tests, changelog fragments, `putitoutthere` for
releases, `just` for contributor commands.

- `cd packages/python/telelux && just lint typecheck test_unit build` — the Python
  gate suite. Each package owns its justfile; there is no repo-root one.
- [ARCHITECTURE.md](ARCHITECTURE.md) — package layout and release flow.
- `docs/internals/` — contributor/agent conventions (not published).
