# Migration fragments

One file per breaking change, added in the PR that makes it — this folder
*is* the migration record. Filenames follow `YYYY-MM-DD-<slug>.md` (UTC merge
date; conventions in [`../changelog.d/README.md`](../changelog.d/README.md)),
and fragments are never deleted or rewritten.

Each fragment is a `### <title>` heading and five bold section headings, in
order. Keep every heading, because the check reads the shape; write `_None._`
under one that does not apply, and one sentence under one that does.

```markdown
### Node dogfood runs unit lint

**Summary**

The repository dogfood workflow now checks `packages/node/src` with `unit lint`.

**Required changes**

_None._

**Deprecations removed**

_None._

**Behavior changes without code changes**

The six existing TypeScript mock factories in `packages/node/src` now use typed imports from their real modules.

**Verification**

Run `testing-conventions unit lint packages/node/src --language typescript`.
```

1. **Summary** — what changed and why.
2. **Required changes** — before/after for public API.
3. **Deprecations removed** — anything previously warned about that's now gone.
4. **Behavior changes without code changes** — same API, different runtime behavior.
5. **Verification** — a command that confirms the upgrade worked, with expected output.
