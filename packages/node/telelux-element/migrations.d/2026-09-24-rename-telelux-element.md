### The web component is `telelux-element` with tag `<telelux-transcript>`

**Summary**

The npm package moves from `telelux` to `telelux-element` and the custom element tag from `<tele-lux>` to `<telelux-transcript>`, leaving `telelux` to the Python package.

**Required changes**

Install `telelux-element` instead of `telelux`, change `import 'telelux'` to `import 'telelux-element'`, and replace `<tele-lux>` with `<telelux-transcript>`; the exported class is `TeleluxTranscript`.

**Deprecations removed**

_None._

**Behavior changes without code changes**

_None._

**Verification**

Mount `<telelux-transcript></telelux-transcript>` after importing `telelux-element`; its shadow root renders `hello world`.
