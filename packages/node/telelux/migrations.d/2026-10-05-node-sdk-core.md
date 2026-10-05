### Replace placeholder render with Telelux

**Summary**

The placeholder `render()` export is removed in favor of the native Node `Telelux` SDK.

**Required changes**

Replace `import { render } from 'telelux'` with `import { Telelux } from 'telelux'` and construct `new Telelux('session.jsonl')` to obtain `.html`, `.url`, or `.write(path)`.

**Deprecations removed**

_None._

**Behavior changes without code changes**

_None._

**Verification**

Run `node --input-type=module -e "import { Telelux } from 'telelux'; console.log(typeof Telelux)"`; it prints `function`.
