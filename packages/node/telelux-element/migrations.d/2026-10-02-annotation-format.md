### `annotations` takes an `AnnotationSidecar`

**Summary**

`<telelux-transcript>`'s `annotations` property, previously typed `unknown` and never rendered, is typed as the new `AnnotationSidecar`, the one format for review marks and timeline events.

**Required changes**

TypeScript callers that assigned anything else, such as `el.annotations = [{ label: 'x' }]`, now assign a sidecar: `el.annotations = { version: 1, annotations: [{ id: 'a1', target: { start: { index: 0 } }, label: 'x', source: { kind: 'human' } }] }`.

**Deprecations removed**

_None._

**Behavior changes without code changes**

_None._

**Verification**

Run `pnpm exec tsc --noEmit` in the consuming project; an assignment of the old shape reports a type error and the sidecar shape compiles.
