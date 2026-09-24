# telelux

Agent transcript tooling for Node. npm `telelux`.

## Install

```sh
pnpm add telelux
```

```ts
import { render } from 'telelux';
```

## Status

A scaffold that reserves the name and the folder. `render()` throws
"not implemented" and the API is a placeholder.

`telelux` on npm and `telelux` on PyPI (`packages/python/telelux`) will expose
the same tooling. One will wrap the other; which direction is not yet decided.
Until it is, this package carries no behavior of its own.

## Testing

One tier: **unit**, `pnpm test_unit` (Vitest, colocated `src/*.test.ts`).
