# Telelux — Design Brief

Telelux offers a static transcript viewer, a CLI, and an SDK.

Keep the MVP minimal. Add configuration options only when an agreed use case
requires them; cut speculative customization.

## CLI

```bash
uv run telelux
```

Starts a server for the transcript viewer. `--no-browser` avoids the auto-open behavior.

Use Uvicorn for local serving through both the CLI and SDK. Adopt its default
host (`127.0.0.1`), port (`8000`), and normal server lifecycle and shutdown
behavior. Forward server configuration to Uvicorn, leaving defaults and
validation to Uvicorn rather than maintaining our own copies. Expose host and
port through the CLI. See [Uvicorn settings](https://www.uvicorn.org/settings/).

Keep the existing Click conventions: exit code `0` for success, `1` for
operational failures, and `2` for incorrect usage. Send errors and server logs
to stderr; reserve stdout for the requested HTML, URL, or output path so
commands remain usable in pipelines. See [Click API](https://click.palletsprojects.com/en/stable/api/).

```bash
uv run telelux ./path/to/transcript
```

This will start a server showing the transcript-viewer tied to that transcript.

CLI can also produce a baked-in HTML representation:

```bash
uv run telelux ./path/to/transcript --out ./output-path.html
```

When the output file already exists, fail with an error by default and leave
the existing file unchanged. Apply this behavior to both CLI and SDK file
exports; the CLI reports the failure on stderr with exit code `1`.

CLI can also produce a compressed link to the canonical static hosted viewer:

```bash
uv run telelux ./path/to/transcript --url
> https://telelux.dev/#v=1&data=<encoded-payload>
```

Generated links always target the canonical static hosted viewer over HTTPS;
there is no configurable viewer base URL. `--out` produces a local HTML file
with the transcript baked in. Users may open that file locally or host the
complete artifact themselves. Every viewer page, including a page with a
baked-in transcript, accepts `#v=1&data=`. An explicit source replaces the
baked-in transcript after it loads successfully. The hosting URL above is
illustrative until the canonical deployment is finalized.

## SDK

Telelux can be incorporated into an app. Use
`Telelux(transcript: str | Path | None = None)`. The optional
`transcript` identifies a single file; directories are not supported. The
constructor has no `title` option.

```python
from telelux import Telelux

# transcript can be a string or pathlib.Path
viewer = Telelux(transcript='./path/to/transcript')
viewer.transcript = './path/to/another-transcript' # replace the input file

viewer.html # str: self-contained HTML with the transcript embedded
viewer.url # HTTPS URL to the canonical hosted viewer with #v=1&data
viewer.write('./transcript.html') # write the baked HTML file; returns None

viewer.serve(host="127.0.0.1", port=8000) # optional server exposure via Uvicorn
```

`viewer.transcript` is a readable, settable property accepting a file path or
`None`. Assigning a path replaces the input; assigning `None` clears it.
`Telelux().serve()` starts the empty reusable viewer. The same
`.serve()` method starts a viewer with a transcript when one is set; there is
no separate `serve_viewer()` function.

Follow Uvicorn's synchronous and asynchronous entry points:

- `viewer.serve(...)` blocks until shutdown, delegating to Uvicorn's
  synchronous runner. The CLI uses this method.
- `await viewer.serve_async(...)` delegates to `uvicorn.Server.serve()` for
  callers with an existing event loop. It waits for shutdown while allowing
  other async tasks to run. Callers that need to continue immediately can
  schedule it with `asyncio.create_task()` and own the task's lifecycle.
- Both methods use the same application, transcript state, host/port defaults,
  and Uvicorn lifecycle and shutdown behavior. Avoid custom background threads,
  event-loop detection, or a `blocking` option.
- Accept Uvicorn keyword options through `serve(**uvicorn_options)` and
  `serve_async(**uvicorn_options)`. Forward them directly to `uvicorn.run()`
  and `uvicorn.Config()`, respectively, supplying the viewer application
  internally. Let the selected Uvicorn entry point determine supported options,
  defaults, validation, and errors. Viewer-specific browser opening remains
  separate from Uvicorn configuration.

Simply calling the blocking `.serve()` inside an `async def` does not make it
nonblocking; the async entry point must await Uvicorn's async server method.
See [Uvicorn's programmatic usage](https://www.uvicorn.org/#running-programmatically).

Read and parse the file when `transcript` is assigned, including during
construction. Keep a snapshot so HTML and URL exports describe the same
content even if the source file changes. Successful assignment replaces the
snapshot and invalidates generated artifacts; failed assignment preserves the
previous transcript. Assigning `None` clears the snapshot. Generate exports
on demand.

When no transcript is set, transcript export operations, including `.html`
and `.url`, raise `ValueError("No transcript set")`. The empty state is served
through `.serve()`.

Assignments made while serving apply to subsequent page loads. The MVP does
not push updates to already open pages or automatically refresh them.

`viewer.html` returns a Python `str` containing the complete, self-contained
HTML document with the transcript and all required assets embedded.
`viewer.url` always targets the same canonical hosted viewer as CLI `--url`.

`viewer.write(output_path: str | Path)` writes the same HTML content as
`.html` to a UTF-8 file and returns `None`. It is the SDK counterpart to CLI
`--out`. Raise `FileExistsError` if the destination exists, preserving the
existing file, or `ValueError("No transcript set")` if no transcript is set.

Use standard `OSError` subclasses for filesystem failures and
`UnicodeDecodeError` for invalid UTF-8. Use `ValueError` for unsupported input
structure and link-size failures in the MVP, without custom exception classes.
Malformed JSON lines continue to become visible raw records rather than
exceptions. The CLI converts expected failures into Click errors; the SDK
raises exceptions and never exits the process.

## Static Transcript Viewer

### Goal

Deployed as static assets at https://telelux.dev/. Users load transcripts into the browser, where they are parsed and rendered without a backend server.

Preserve the existing viewer's rendering and interaction behavior. The intended product change is how transcripts are supplied: add a reusable static page with a dynamic loader alongside the existing transcript-specific HTML generation, which is preserved.

Offer a small theme selector inspired by `transcript-viewer`: `paper`, `cool`,
and `dark`. Themes change presentation only and do not alter transcript
content or behavior. Remember the selected theme as a local UI preference, but
never store transcript contents or fetch caches in that preference.

## Four ways to load a transcript

1. **Local file:** Drop a transcript onto the page or select it with a file picker.
2. **URL entry:** Paste a transcript URL into the page and load it.
3. **Direct link:** Open a viewer URL that identifies a hosted transcript; the viewer fetches and displays it automatically without another input step. https://telelux.dev/#v=1&data=https://example.com/transcript.jsonl
4. **Compressed link:** Open a viewer URL containing compressed transcript data; the viewer decompresses and displays it without fetching a transcript file. Provide a way to produce these shareable links. https://telelux.dev/#v=1&data=<encoded-payload>


## Architecture and deployment

- Serve the application as static assets at https://telelux.dev/ (GitHub Pages).
- Ship prebuilt browser assets with the Python package. Generate HTML and
  compressed links in Python without a running server, Node, or an installed
  browser. Node may be used during development and release builds, but is not
  required by installed users for these operations.
- Use Uvicorn with a small ASGI application to serve the viewer locally through
  the SDK and CLI. Use the same reusable application and all four loading
  methods, including fragment loading, for hosted and Uvicorn viewers. The
  hosted deployment remains entirely static.
- Load, parse, decompress, and render transcripts in the browser.
- Preserve the current model of baking a transcript into generated HTML: the
  CLI continues to produce self-contained pages with the transcript embedded
  (`--out`). The deployed viewer page must be reusable across transcripts
  without rebuilding it. Exported HTML opens its baked transcript immediately,
  while also accepting an explicit `#v=1&data=` source that can replace it; all
  transcript interactions, including record inspection, remain available.
- Bundle all required CSS, JavaScript, fonts, and other assets into exported
  HTML so it works fully offline. Verify that rendering and record inspection
  work with networking disabled.
- Support direct and compressed links on the static host without requiring
  server-side routing or a backend proxy.
- Use the versioned fragment format `#v=1&data=<value>` for both loading modes.
  Parse `v` as the envelope version, then read everything after the literal
  `&data=` as one value, without query-parameter parsing or an additional
  URL-decoding pass. An explicit `http://` or `https://` prefix identifies a
  raw hosted transcript URL to fetch; otherwise decode the value as the
  version-1 compressed payload. Preserve the nested URL's `?`, `&`, `=`, and
  existing percent escapes. The nested URL only needs its normal URL escaping,
  not whole-URL encoding. For example:
  `#v=1&data=https://example.com/transcript.jsonl?token=abc&download=1`.
  If fetching fails, show the fetch error without falling back to payload
  decoding. Invalid payloads show a decoding error. Unknown versions show a
  compatibility error. Hosted, Uvicorn, and baked-in exported viewers accept
  this format. Generated share links from the viewer, CLI, and SDK always
  target the canonical hosted viewer, including when generated while viewing a
  transcript locally.
- The URL is the source of truth for reusable viewer state. A successful URL,
  file, or compressed-data load must produce the corresponding canonical
  `#v=1&data=` URL before it becomes the displayed transcript; Back/Forward and
  refresh recover state by loading that URL. Do not keep a separate hidden
  transcript state. If a local file cannot fit within the compressed-link
  limit, reject it with an actionable size error and direct the user to baked
  HTML export or hosting the transcript for a `#v=1&data=<transcript-url>` link.
- Browser file selection is local-only: when the compressed file fits, navigate
  to its `#v=1&data=<compressed-payload>` URL and display it. Do not synthesize a
  `file://` URL or a nonportable local identifier for an upload. When it does
  not fit, keep the current transcript visible, report that the upload is too
  large for a shareable URL, and offer a standalone HTML download. The
  standalone file may then be opened with `file://` because its transcript is
  baked into the document.
- Show the loading screen only when the viewer has no baked-in transcript. If a
  baked-in transcript is present, render it immediately while an explicit
  `#v=1&data=` source loads; replace it only after that source loads successfully.
- Cache successful hosted-transcript fetches in memory for the lifetime of the
  viewer. Do not use local storage for this fetch cache. Reusing a URL should
  use the cached bytes or parsed records without another network request.
- Do not persist transcripts or fetch caches in IndexedDB, localStorage, or
  other browser storage. Local uploads that are not represented by a `#v=1&data=`
  link are available only until the page is refreshed or closed.
- Treat every transcript as untrusted display data. Render text with safe DOM
  APIs or proper escaping; never interpret transcript content as HTML, Markdown
  markup, JavaScript, or another executable format. Do not execute code from a
  transcript or permit transcript content to exfiltrate transcript data.
  Follow browser security best practices, including safe URL handling and a
  restrictive Content Security Policy where the deployment permits it.
- The product never uploads, transmits, or submits transcript contents to a
  server, analytics service, LLM, error-reporting service, or other third party.
  Local file selection and drag-and-drop only read the file in the browser.
  Fetching a transcript from a URL is permitted because the user explicitly
  provides that source; the viewer must not forward that content anywhere else.
- Do not include analytics or telemetry.
- Parse and decompress `#v=1&data=` payloads immediately on the client. Do not add
  an artificial delay or loading state for local compressed data.
- Associate each fetch with the request that started it. A result may update
  the viewer only if that request is still the current request for the same
  source; a stale result is ignored even if cancellation arrives too late.
- Fragments keep the transcript address or embedded data out of the initial
  request to the viewer host and HTTP referrer headers. Fetching a hosted
  transcript still contacts its source server. Fragments remain readable by
  page scripts and anyone with the complete link, and may persist in browser
  history; they do not provide encryption. See [URI fragments](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)
  and [HTTP referrer headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referer).
- Account for browser cross-origin restrictions when fetching hosted transcripts;
  show a useful error when a host does not permit access.
- Define practical limits for compressed links and handle invalid, truncated, or
  oversized payloads gracefully.
- Keep generated links at or below 8,000 ASCII characters for practical
  portability. Use versioned gzip with base64url for embedded payloads and cap
  decompressed embedded data at 10 MiB. For ordinary file and hosted-URL input,
  cap decoded text at 50 MiB and records at 100,000, enforcing limits while
  reading or decompressing. Do not split one transcript across multiple URLs;
  offer baked HTML export or a `#v=1&data=` link to a separately hosted transcript
  for larger inputs. These limits apply to the MVP and may be revised only with
  compatibility and performance evidence.
- Target usability within 2 seconds after bytes are available for a
  representative 10 MiB / 10,000-record transcript on the reference
  browser/device, with common interactions responding within 100 ms. Show
  progress and cancellation for slower loads, reject oversized input with its
  actual size and applicable limit, and never silently truncate records.
- Give hosted fetches a 30-second overall deadline. Provide cancellation and
  cancel an older request when a newer load starts or history navigation changes
  the source. Do not retry automatically in the MVP; provide an explicit Retry
  action. Distinguish HTTP errors, timeouts, and CORS/network failures when the
  browser makes that distinction available.

## Behavior to preserve

Use the current implementation and its fixtures as the behavioral reference for
transcript parsing, record ordering, rendered content, metadata, usage totals,
record inspection, and existing interactions. Preserve the handling of malformed
records and supported record types.

For this MVP, the existing implementation and fixtures are the authority for
these details: a transcript is one UTF-8 JSON-lines file; blank lines are
skipped; malformed nonblank lines remain visible as raw records; supported
record types, ordering, rendered content, metadata, usage totals, inspection,
and interactions retain their current behavior. Preserve filename-derived
metadata from the selected file. Rendering parity means equivalent visible
content and interactions, not byte-identical generated HTML.

Accept one transcript file per load through the CLI, SDK, and browser.
In the reusable hosted and Uvicorn applications, each successful load replaces
the currently displayed transcript rather than appending to it.
Directory input, multi-file selection, and merging are outside the MVP scope.
Reject directory input and attempts to load multiple files with a clear error.
This intentionally removes the existing loader's directory support.

No additional rendering redesign or transcript-format expansion is part of this
change. The existing transcript-to-HTML CLI workflow is preserved alongside the
static application; the CLI is also one way to produce compressed links.

## Repository foundation

- Prefer structuring the repository around `thekevinscott/template-lib`.
- Incorporate `testing-conventions` and `putitoutthere` at the outset, before
  implementing the loading flows.
- Inspect those projects' actual conventions and setup requirements before
  choosing the application stack, test tooling, or deployment configuration.
- Use `template-lib` and comparable repositories such as `dirsql` as the
  concrete setup and convention references. Match their layout, tooling,
  commands, and deployment patterns rather than inventing parallel project
  conventions.
- The Python package must generate, serve, and export the viewer offline without
  Node, an installed browser, or network access. Browser assets are built ahead
  of time and packaged with the Python distribution.
- Use one shared transcript parsing and normalization implementation across the
  Python SDK, CLI, and browser viewer. Do not maintain separate Python and
  browser parser implementations with independently evolving behavior.

These are implementation requirements, not integrations already completed by
this brief.

## Testing convention: red first

For each new behavior or defect fix, write a named test that expresses the
required behavior, run it, and observe it fail for the intended reason before
implementing the change. Then make it pass. Preserve existing behavior with
regression coverage as the renderer moves into the browser.

Keep three explicit test tiers:

| Tier | Scope | Mocking policy |
| --- | --- | --- |
| Unit | Isolated parsing, rendering logic, URL handling, and compression behavior | Isolate dependencies as needed. |
| Integration | Connected application behavior through public entry points | Mock all LLM calls when those are introduced. |
| End-to-end | Complete user flows through the running static application | No mocks, including for future LLM calls. |

Expose separate commands for each tier. LLM functionality is forthcoming and is
not part of this change; establish the test boundaries now.

Follow the testing layout and command conventions established by `template-lib`
and `dirsql`; keep the three tiers explicit and runnable independently.

The CLI should be implemented in such a way that it is a thin wrapper around the SDK. Integration tests should target the SDK exclusively, and functionality should exist 1:1 in CLI and SDK.

e2e tests should target both the SDK and the CLI, though the majority should target the CLI.

## Acceptance criteria

- The viewer deploys to https://telelux.dev/ and operates without a backend server.
- Each of the four loading strategies displays the same transcript with
  equivalent content and interactions.
- Direct and compressed links load automatically on a fresh page visit.
- Users can produce a compressed link and reopen it to recover the transcript.
- Existing rendering behavior is retained, and baked transcript HTML generation
  continues to work alongside the new dynamic loading.
- Loading failures are visible and actionable, including inaccessible URLs and
  invalid compressed data.
- Repository conventions, deployment tooling, and the three test tiers are
  established up front, with observed failing tests preceding implementation.

## Decisions for implementation

- Confirm the template and tooling setup, then choose the browser application
  stack and the renderer migration approach.
- Specify compression format, version compatibility,
  and payload limits.
- Define the compressed-link creation interface.
- Decide how the CLI, SDK, and static viewer share parsing and rendering logic,
  and what Python library surface the SDK exposes publicly.

## FUTURE IDEAS

- For transcripts too large to fit in a compressed `#v=1&data=` link, offer an
  explicitly user-initiated GitHub Gist publishing flow and return a canonical
  viewer link whose `data` value points at the gist's raw transcript URL. This
  could follow the `agent-session-viewer` pattern of a one-time GitHub token
  with only the `gist` scope and separate view and gist-management URLs. Gist
  publishing uploads transcript contents and therefore requires an explicit
  revision of the current no-upload policy, along with clear disclosure,
  authentication, deletion, and failure behavior. It is not part of the MVP.
