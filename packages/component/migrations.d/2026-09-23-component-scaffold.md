# Summary

Added `telelux` on npm, a new `packages/component` workspace scaffolding the
`<tele-lux>` web component from #49. This is the package's first published
surface, so there is nothing prior for consumers to migrate from.

# Required changes

None — net-new package, no prior release to migrate from.

# Deprecations removed

None.

# Behavior changes without code changes

None.

# Verification

```sh
npm install telelux lit
```

```html
<script type="module">
  import 'telelux';
</script>

<tele-lux></tele-lux>
```

Renders the placeholder text `hello world` in the element's shadow root. See
the package README for the no-bundler (import map) route.
