Added: `telelux` on npm, a new `packages/component` workspace scaffolding the
web component from #49. The `<tele-lux>` custom element currently renders
only the placeholder text "hello world"; transcript rendering lands in later
sub-issues. Built with Vite in library mode (ESM plus type declarations,
`lit` external rather than bundled), tested with Vitest (unit) and Playwright
(integration), and wired into `putitoutthere` for release.
