# telelux frontend (internal)

Internal TypeScript workspace for the static HTML viewer. **Never published to
npm** — the built viewer artifact is bundled into the Python wheel
(`packages/python/telelux`) and served/saved by the Python SDK.

Source lives in `src/` with colocated `*.test.ts` unit tests (Vitest).
