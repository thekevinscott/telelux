import { css, html, LitElement, nothing, type PropertyValues } from 'lit';

import './telelux-annotation';
import './telelux-message';
import './telelux-metadata';
import './telelux-minimap';
import './telelux-timeline';
import { type AnnotationFilter, matchesFilter } from './annotation-filter';
import { sourceName } from './annotation-labels';
import { type AnnotationSidecar, parseAnnotations } from './annotations';
import { blockNumber } from './block-number';
import { currentBlock } from './current-block';
import { definedEntries } from './defined-entries';
import { displayName } from './display-name';
import { downloadJson } from './download-json';
import { formatCreatedAt } from './format-created-at';
import { isTextEntry } from './is-text-entry';
import { parseRawTranscript } from './parse-raw-transcript';
import { resolveAnnotation, type ResolutionChange } from './resolve-annotation';
import { resolveAnnotations, type ResolvedAnnotations } from './resolve-annotations';
import { targetBlock } from './target-block';
import { theme } from './theme';
import { parseTranscript, type ParseResult, type Transcript } from './transcript';
import { transcriptTotals, USAGE_TOTALS } from './transcript-totals';

const ROLES = ['user', 'assistant', 'tool', 'system'] as const;
const FLASH_MS = 1500;
const STATUSES = [['unresolved', 'Unresolved'], ['confirmed', 'Confirmed'], ['rejected', 'Rejected']] as const;

export class TeleluxTranscript extends LitElement {
  static override properties = {
    transcript: { attribute: false },
    annotations: { attribute: false },
    format: { type: String },
    theme: { type: String, reflect: true },
    slotText: { state: true },
    metadataOpen: { state: true },
    copyStatus: { state: true },
    highlighted: { state: true },
    current: { state: true },
    sidecar: { state: true },
    annotationFilter: { state: true },
  };

  static override styles = [theme, css`
    :host {
      display: block;
      font-family: var(--_font-sans);
      font-size: var(--_font-size);
      color: var(--_foreground);
      background: var(--_background);
    }

    :host(:focus) {
      outline: none;
    }

    .header {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--_muted-foreground);
    }

    .identity,
    .jump {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .label {
      font-weight: 600;
      color: var(--_foreground);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 2px 1px 6px;
      border: 1px solid var(--_border);
      border-radius: 999px;
      background: var(--_secondary);
    }

    .id {
      font-family: var(--_font-mono);
      overflow-wrap: anywhere;
    }

    .name {
      color: var(--_foreground);
    }

    button {
      padding: 1px 6px;
      border: 1px solid var(--_border);
      border-radius: var(--_radius-sm);
      background: var(--_background);
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .pill button {
      border-radius: 999px;
    }

    button:hover,
    button[aria-expanded='true'] {
      background: var(--_secondary);
    }

    .popover {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1;
      max-width: min(480px, 90vw);
      max-height: 320px;
      overflow: auto;
      padding: 8px;
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      background: var(--_background);
      color: var(--_foreground);
      box-shadow: 0 4px 12px var(--_shadow);
    }

    .popover-title {
      margin-bottom: 6px;
      font-weight: 600;
    }

    .totals {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin: 0;
    }

    .totals div {
      display: flex;
      gap: 4px;
    }

    .totals dd {
      margin: 0;
      color: var(--_foreground);
      font-variant-numeric: tabular-nums;
    }

    .jump input {
      width: 6em;
      border: 1px solid var(--_border);
      border-radius: var(--_radius-sm);
      background: var(--_background);
      font: inherit;
      color: inherit;
    }

    ol {
      display: flex;
      flex-direction: column;
      gap: var(--_block-gap);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      scroll-margin-top: 8px;
      border-radius: var(--_radius);
    }

    li.highlight {
      outline: 2px solid var(--_highlight);
      outline-offset: 2px;
    }

    .block-nav {
      position: sticky;
      bottom: 12px;
      display: flex;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 8px;
      pointer-events: none;
    }

    .block-nav button {
      pointer-events: auto;
      box-shadow: 0 2px 6px var(--_shadow);
    }

    .annotations {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .annotations-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .annotations-count {
      font-weight: 600;
    }

    .annotations select,
    .annotations input {
      border: 1px solid var(--_border);
      border-radius: var(--_radius-sm);
      background: var(--_background);
      font: inherit;
      color: inherit;
    }

    .annotations-mismatch,
    .annotations-error {
      margin: 0;
      color: var(--_destructive);
      white-space: pre-wrap;
    }

    .unanchored {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .unanchored summary {
      cursor: pointer;
      color: var(--_muted-foreground);
    }

    .unanchored telelux-annotation,
    li telelux-annotation {
      margin-top: 4px;
    }

    kbd {
      margin-left: 4px;
      font-family: var(--_font-mono);
      font-size: 10px;
      color: var(--_muted-foreground);
    }
  `];

  declare transcript: Transcript | undefined;
  declare annotations: AnnotationSidecar | null | undefined;
  declare format: string | undefined;
  declare theme: string | undefined;
  private declare slotText: string | undefined;
  private declare metadataOpen: boolean;
  private declare copyStatus: string | undefined;
  private declare highlighted: { start: number; end: number } | undefined;
  private declare current: number | undefined;
  private declare sidecar: AnnotationSidecar | undefined;
  private declare annotationFilter: AnnotationFilter;

  #parsed: ParseResult | undefined;
  #annotationsError: string | undefined;
  #resolved: ResolvedAnnotations | undefined;
  #visible: AnnotationSidecar | undefined;
  #reviewer = '';
  #tracked: number | undefined;
  #highlightTimer: ReturnType<typeof setTimeout> | undefined;
  #copyTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.addEventListener('keydown', this.#onKeydown);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = -1;
    }
    this.#readSlot();
    document.addEventListener('scroll', this.#onScroll, { capture: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('scroll', this.#onScroll, { capture: true });
  }

  #readSlot = () => {
    const text = [...this.childNodes]
      .filter((node) => !(node instanceof Element && node.hasAttribute('slot')))
      .map((node) => node.textContent)
      .join('');
    this.slotText = text.trim() === '' ? undefined : text;
  };

  protected override willUpdate(changed: PropertyValues) {
    const reparse = changed.has('transcript') || changed.has('slotText') || changed.has('format');
    if (reparse) {
      this.#parsed = this.#parse();
      this.metadataOpen = false;
      this.highlighted = undefined;
      this.#tracked = undefined;
      this.current = 0;
    }
    if (changed.has('annotations')) {
      const parsed = this.annotations == null ? undefined : parseAnnotations(this.annotations);
      this.sidecar = parsed?.ok === true ? parsed.annotations : undefined;
      this.#annotationsError = parsed?.ok === false ? parsed.error : undefined;
      this.annotationFilter = {};
    }
    if (changed.has('sidecar') || changed.has('annotationFilter')) {
      this.#visible = this.sidecar && { ...this.sidecar, annotations: this.sidecar.annotations.filter((annotation) => matchesFilter(annotation, this.annotationFilter)) };
    }
    if ((reparse || changed.has('sidecar')) && this.#parsed?.ok === true) {
      this.#resolved = resolveAnnotations(this.#parsed.transcript.messages, this.sidecar?.annotations ?? []);
    }
  }

  #parse(): ParseResult | undefined {
    if (this.transcript != null) {
      return parseTranscript(this.transcript);
    }
    return this.slotText === undefined ? undefined : parseRawTranscript(this.slotText, { format: this.format });
  }

  override render() {
    return html`<slot hidden @slotchange=${this.#readSlot}></slot>${this.#view()}`;
  }

  #view() {
    if (this.#parsed === undefined) {
      return html`<p class="empty">No transcript.</p>`;
    }
    if (!this.#parsed.ok) {
      return html`<pre class="error" role="alert">Invalid transcript:\n${this.#parsed.error}</pre>`;
    }
    const { transcript } = this.#parsed;
    const { messages } = transcript;
    if (messages.length === 0) {
      return html`${this.#header(transcript)}${this.#annotationsPanel(transcript)}<p class="empty">No messages.</p>`;
    }
    const anchored = (this.#resolved as ResolvedAnnotations).anchored.filter(({ annotation }) => matchesFilter(annotation, this.annotationFilter));
    return html`${this.#header(transcript)}${this.#annotationsPanel(transcript)}${this.sidecar === undefined
      ? nothing
      : html`<telelux-timeline exportparts="timeline" theme=${this.theme ?? nothing} .messages=${messages} .annotations=${this.#visible} @telelux-jump=${(event: CustomEvent<{ index: number; end: number }>) => this.#goTo(event.detail.index, event.detail.end)}></telelux-timeline>`}<telelux-minimap part="minimap" theme=${this.theme ?? nothing} .messages=${messages} .current=${this.current} @telelux-jump=${(event: CustomEvent<{ index: number }>) => this.#goTo(event.detail.index)}></telelux-minimap><ol @telelux-resolve=${this.#onResolve}>
      ${messages.map((message, index) => html`<li class=${this.highlighted !== undefined && index >= this.highlighted.start && index <= this.highlighted.end ? 'highlight' : nothing}><telelux-message exportparts="block, block-user, block-assistant, block-system, block-tool, header, content, reasoning, tool-call" theme=${this.theme ?? nothing} .message=${message} .index=${index}></telelux-message>${anchored
        .filter(({ start }) => start === index)
        .map(({ annotation, start, end }) => html`<telelux-annotation exportparts="annotation" theme=${this.theme ?? nothing} .annotation=${annotation} .span=${{ start, end }}></telelux-annotation>`)}</li>`)}
    </ol>
    <nav class="block-nav" part="block-nav" aria-label="Block navigation">
      <button class="previous" type="button" aria-label="Previous block" aria-keyshortcuts="k" @click=${() => this.#step(-1)}>Previous<kbd>K</kbd></button>
      <button class="next" type="button" aria-label="Next block" aria-keyshortcuts="j" @click=${() => this.#step(1)}>Next<kbd>J</kbd></button>
    </nav>`;
  }

  #header(transcript: Transcript) {
    const name = displayName(transcript.name);
    const createdAt = formatCreatedAt(transcript.created_at);
    const keys = definedEntries(transcript.metadata).length;
    const count = transcript.messages.length;
    return html`<header class="header" part="transcript-header" @keydown=${this.#onHeaderKeydown}>
      <slot name="before"></slot>
      <div class="identity">
        <span class="label">Transcript</span>
        <span class="pill"><code class="id">${transcript.id}</code><button class="copy" type="button" aria-label="Copy transcript id" @click=${() => this.#copy(transcript.id)}>${this.copyStatus ?? 'Copy'}</button></span>
        ${name === undefined ? nothing : html`<span class="name">${name}</span>`}
        ${createdAt === undefined ? nothing : html`<span class="created-at" title=${transcript.created_at as string}>${createdAt}</span>`}
        ${keys > 0 ? html`<button class="metadata-toggle" type="button" aria-haspopup="dialog" aria-expanded=${this.metadataOpen} @click=${() => (this.metadataOpen = !this.metadataOpen)}>Metadata (${keys})</button>` : nothing}
      </div>
      ${this.metadataOpen ? html`<div class="popover" role="dialog" aria-label="Transcript Metadata"><div class="popover-title">Transcript Metadata</div><telelux-metadata theme=${this.theme ?? nothing} .metadata=${transcript.metadata}></telelux-metadata></div>` : nothing}
      ${this.#totals(transcript)}
      ${count === 0 ? nothing : html`<form class="jump" @submit=${(event: SubmitEvent) => this.#onJump(event, count)}>
        <span class="count">${count.toLocaleString()} ${count === 1 ? 'block' : 'blocks'}</span>
        <input name="block" type="number" min="0" max=${count - 1} placeholder="Block #" aria-label="Jump to block" />
      </form>`}
    </header>`;
  }

  #annotationsPanel(transcript: Transcript) {
    if (this.#annotationsError !== undefined) {
      return html`<pre class="annotations-error" role="alert">Invalid annotations:\n${this.#annotationsError}</pre>`;
    }
    if (this.sidecar === undefined) {
      return nothing;
    }
    const { annotations, transcript_id: named } = this.sidecar;
    const shown = annotations.filter((annotation) => matchesFilter(annotation, this.annotationFilter)).length;
    const unanchored = (this.#resolved as ResolvedAnnotations).unanchored.filter(({ annotation }) => matchesFilter(annotation, this.annotationFilter));
    const distinct = (values: string[]) => [...new Set(values)].sort().map((value) => [value, value] as const);
    return html`<section class="annotations" part="annotations" aria-label="Annotations" @telelux-resolve=${this.#onResolve}>
      <div class="annotations-bar">
        <span class="annotations-count">Annotations (${shown === annotations.length ? shown : `${shown} of ${annotations.length}`})</span>
        ${this.#filterSelect('label', 'labels', distinct(annotations.map(({ label }) => label)))}
        ${this.#filterSelect('source', 'sources', distinct(annotations.map(({ source }) => sourceName(source))))}
        ${this.#filterSelect('status', 'statuses', STATUSES)}
        <input class="reviewer" aria-label="Reviewer" placeholder="Reviewer" @input=${(event: InputEvent) => (this.#reviewer = (event.currentTarget as HTMLInputElement).value)} />
        <button class="download" type="button" @click=${() => downloadJson(`${transcript.id}.annotations.json`, this.sidecar)}>Download annotations</button>
      </div>
      ${named === undefined || named === transcript.id ? nothing : html`<p class="annotations-mismatch" role="status">These annotations name transcript "${named}", not "${transcript.id}".</p>`}
      ${unanchored.length === 0 ? nothing : html`<details class="unanchored" open><summary>Unanchored (${unanchored.length})</summary>${unanchored.map(({ annotation, reason }) => html`<telelux-annotation exportparts="annotation" theme=${this.theme ?? nothing} .annotation=${annotation} .reason=${reason}></telelux-annotation>`)}</details>`}
    </section>`;
  }

  #filterSelect(key: keyof AnnotationFilter, plural: string, options: readonly (readonly [string, string])[]) {
    const onChange = (event: Event) => {
      const { value } = event.currentTarget as HTMLSelectElement;
      this.annotationFilter = { ...this.annotationFilter, [key]: value === '' ? undefined : value };
    };
    return html`<select class=${key} aria-label="Filter by ${key}" .value=${this.annotationFilter[key] ?? ''} @change=${onChange}>
      <option value="">All ${plural}</option>
      ${options.map(([value, text]) => html`<option value=${value}>${text}</option>`)}
    </select>`;
  }

  #onResolve = (event: CustomEvent<Pick<ResolutionChange, 'state' | 'note'> & { id: string }>) => {
    const { id, state, note } = event.detail;
    this.sidecar = resolveAnnotation(this.sidecar as AnnotationSidecar, id, { state, note, by: this.#reviewer, at: new Date().toISOString() });
    this.dispatchEvent(new CustomEvent('telelux-annotations-change', { bubbles: true, composed: true, detail: { annotations: this.sidecar } }));
  };

  #totals(transcript: Transcript) {
    const totals = transcriptTotals(transcript.messages);
    const roles = ROLES.filter((role) => totals.roles[role] !== undefined).map((role) => `${(totals.roles[role] as number).toLocaleString()} ${role}`);
    const usage = USAGE_TOTALS.filter(([key]) => totals.usage[key] !== undefined).map(([key, label]) => html`<div class=${key}><dt>${label}</dt><dd>${(totals.usage[key] as number).toLocaleString()}</dd></div>`);
    return html`<dl class="totals">
      ${roles.length === 0 ? nothing : html`<div class="roles"><dt>Messages</dt><dd>${roles.join(' · ')}</dd></div>`}
      <div class="tool-calls"><dt>Tool calls</dt><dd>${totals.toolCalls.toLocaleString()}</dd></div>
      ${usage}
    </dl>`;
  }

  #onHeaderKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.metadataOpen) {
      this.metadataOpen = false;
      (this.renderRoot.querySelector('.metadata-toggle') as HTMLButtonElement).focus();
    }
  }

  #onKeydown = (event: KeyboardEvent) => {
    const step = ({ j: 1, k: -1 } as Record<string, number | undefined>)[event.key.toLowerCase()];
    if (step === undefined || event.ctrlKey || event.metaKey || event.altKey || isTextEntry(event.composedPath()[0])) {
      return;
    }
    event.preventDefault();
    this.#step(step);
  };

  #onJump(event: SubmitEvent, count: number) {
    event.preventDefault();
    const input = (event.currentTarget as HTMLFormElement).elements.namedItem('block') as HTMLInputElement;
    const index = blockNumber(input.value, count);
    if (index !== undefined) {
      this.#goTo(index);
    }
  }

  #items(): HTMLLIElement[] {
    return [...this.renderRoot.querySelectorAll<HTMLLIElement>('ol > li')];
  }

  #extents() {
    return this.#items().map((item) => item.getBoundingClientRect());
  }

  #onScroll = () => {
    this.current = currentBlock(this.#extents(), window.innerHeight, this.#tracked);
  };

  #step(step: number) {
    const index = targetBlock(this.#extents(), window.innerHeight, this.#tracked, step);
    if (index !== undefined) {
      this.#goTo(index);
    }
  }

  goToBlock(start: number, end = start) {
    const index = blockNumber(String(start), this.#items().length);
    if (index !== undefined) {
      this.#goTo(index, end);
    }
  }

  #goTo(index: number, end = index) {
    this.#tracked = index;
    this.current = index;
    this.#items()[index].scrollIntoView({ block: 'start', behavior: 'smooth' });
    this.highlighted = { start: index, end };
    clearTimeout(this.#highlightTimer);
    this.#highlightTimer = setTimeout(() => (this.highlighted = undefined), FLASH_MS);
  }

  #copy(id: string) {
    void Promise.resolve()
      .then(() => navigator.clipboard.writeText(id))
      .then(() => 'Copied', () => 'Copy failed')
      .then((status) => {
        this.copyStatus = status;
        clearTimeout(this.#copyTimer);
        this.#copyTimer = setTimeout(() => (this.copyStatus = undefined), FLASH_MS);
      });
  }
}

customElements.define('telelux-transcript', TeleluxTranscript);
