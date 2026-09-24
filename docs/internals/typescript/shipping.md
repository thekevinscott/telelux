# TypeScript — shipping

> This repo's TypeScript workspace (`packages/node/telelux-web`) is **internal tooling**
> and is never published to npm — the built viewer ships inside the Python
> wheel. The sections below cover the conventions that still apply (CI shape,
> lint, docs, API design). Registry publishing, trusted-publisher setup, and
> release flow live in [../python/shipping.md](../python/shipping.md) — the
> Python package is the only published artifact.

## Github

Github is the source of truth.

### Github Actions

`concurrency` in GitHub Actions:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This cancels the previous CI run on the same ref. Cheap, always wanted.

---

## Lint + format

**ESLint + Prettier.** `@typescript-eslint/no-floating-promises` is the highest-value rule — keep it enabled.

Minimal `.eslintrc.cjs`:

```js
module.exports = {
  env: { node: true, es2022: true },
  ignorePatterns: ['dist/', '**/*.generated.ts'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.eslint.json', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    'curly': ['error', 'all'],
    'comma-dangle': ['error', 'always-multiline']
  }
};
```

`.prettierrc`:

```json
{ "printWidth": 80, "trailingComma": "all", "singleQuote": true }
```

`eslint-config-prettier` disables conflicting rules. Prettier owns layout, ESLint owns correctness. Configure `printWidth` once at root and move on.

**Pre-commit hooks**: per-commit hooks that block trivial WIP commits are net-negative. Pre-push or none at all is fine. **What matters is that CI fails on lint errors.**

Lint should include test files. The `*.generated.ts` glob is the standard escape hatch for codegen output.

---

## Public API design

**Barrels with explicit named re-exports.** Not `export * from './foo'` at every level — that's how things accidentally become public.

```ts
// src/index.ts
export { Widget } from './widget';
export { AbortError } from './errors';
export type { ModelDefinition, WidgetOptions } from './types';
```

Type exports are explicit `export type` — supports `isolatedModules` and `verbatimModuleSyntax`.

**Class vs function**: if the public API is "construct a thing and call methods on it", use a class. If it's "call a function", use a function. Mixing — a default-exported class that wraps an internal named factory function — is fine.

**Default export vs named export**: default for the "primary thing", named for everything else. Pure-named is also fine, and friendlier to refactor tools. What matters is consistency within one package.

**JSDoc for hidden API**: `@hidden` (typedoc) or `@internal` (TS — gated by `--stripInternal`). Pick one and stick with it:

```ts
class Widget {
  /** @hidden */
  _opts: WidgetOptions;

  /** Public method documented for consumers. */
  run(input: Input): Promise<Output> { /* ... */ }
}
```

Underscored field names + `@hidden` is the strongest convention. `private` keyword still emits to `.d.ts`; `#private` (real private) is fine but breaks reflection in ways some consumers care about.

For test-friendly classes, expose dependencies via the constructor (factory injection / DI) so tests can pass fakes without runtime mocking.

---


## Docs

**Docusaurus 2** for richer doc sites (multi-version, search, plugin ecosystem). **VitePress** for simpler ones (Vite-native, faster, less to configure). For a new project, VitePress unless you actually need Docusaurus features.

**Generate the API reference from JSDoc.** typedoc + `typedoc-plugin-markdown` + `docusaurus-plugin-typedoc` reads JSDoc and emits Markdown. typedoc respects `@hidden`/`@internal`. Generated docs stay in sync with the source.

**Per-package metadata under a namespaced key in `package.json`** is the load-bearing pattern:

```json
"@telelux": {
  "title": "Pretty Display Name",
  "guide": { "frontmatter": { "category": "core" } }
}
```

The doc generator reads this. Single source of truth (the package's own `package.json`), no sidecar YAML.

**Code groups for multi-language libraries** (VitePress `::: code-group`, Docusaurus `<Tabs>`). When you do this, **set up a test that the code samples actually run**, or they will drift. Docs that systematically lie about an async API the code doesn't implement is what happens without sample tests.

---

## CI/CD

`.github/workflows/` shape:

| Workflow | Purpose | Trigger |
|---|---|---|
| `test.yml` | Unit + integration | every push/PR |
| `lint.yml` | ESLint + Prettier | every push/PR |
| `typecheck.yml` | `tsc --noEmit` | every push/PR |
| `docs.yml` | Build + deploy docs | push to main, `docs/**` |
| `release.yml` | `uses: thekevinscott/putitoutthere/.github/workflows/release.yml@v0` | push to main |
| `changelog-check.yml` | changelog fragment added under the package's `changelog.d/` (or `skip-changelog:` trailer) | every PR |

Composite action for repeated setup (`.github/actions/setup-pnpm/action.yml`):

```yaml
- uses: pnpm/action-setup@v5
  with: { version: 8, run_install: false }
- uses: actions/setup-node@v6
  with: { node-version: 24, cache: 'pnpm' }
- run: pnpm install --frozen-lockfile
```

**Path filters** to skip irrelevant workflows:

```yaml
on:
  push:
    paths: ['packages/foo/**', 'pnpm-lock.yaml', '.github/workflows/foo.yml']
```

**Concurrency** to cancel previous runs on the same ref (already shown above).

**Matrix**: Node 22 is the LTS floor as of 2026. Matrix on Node 22 + 24 if your dep tree spans them. Pure-JS code matrices on Node version, Ubuntu only. Native bindings matrix on OS (Ubuntu, macOS, Windows) for wheel builds; Ubuntu-only for tests.

**Coverage uploads via Codecov / Coveralls**: nice-to-have, not gating. A per-package floor (85-90%) enforced in CI is only worth doing if you have a real bug-resistance argument.

---
