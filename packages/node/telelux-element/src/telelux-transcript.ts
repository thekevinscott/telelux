import { css, html, LitElement, nothing, type PropertyValues } from 'lit';

import './telelux-message';
import './telelux-metadata';
import { blockNumber } from './block-number';
import { definedEntries } from './defined-entries';
import { displayName } from './display-name';
import { formatCreatedAt } from './format-created-at';
import { isTextEntry } from './is-text-entry';
import { parseRawTranscript } from './parse-raw-transcript';
import { targetBlock } from './target-block';
import { parseTranscript, type ParseResult, type Transcript } from './transcript';
import { transcriptTotals, USAGE_TOTALS } from './transcript-totals';

const ROLES = ['user', 'assistant', 'tool', 'system'] as const;
const FLASH_MS = 1500;

export class TeleluxTranscript extends LitElement {
  static override properties = {
    transcript: { attribute: false },
    annotations: { attribute: false },
    format: { type: String },
    slotText: { state: true },
    metadataOpen: { state: true },
    copyStatus: { state: true },
    highlighted: { state: true },
  };

  static override styles = css`
    :host {
      display: block;
      font-family: var(--telelux-font-sans, system-ui, sans-serif);
      font-size: 14px;
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
      color: var(--telelux-muted-foreground, #6b7280);
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
      color: var(--telelux-foreground, #111827);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 2px 1px 6px;
      border: 1px solid var(--telelux-border, #e5e7eb);
      border-radius: 999px;
      background: var(--telelux-secondary, #f1f5f9);
    }

    .id {
      font-family: var(--telelux-font-mono, ui-monospace, monospace);
      overflow-wrap: anywhere;
    }

    .name {
      color: var(--telelux-foreground, #111827);
    }

    button {
      padding: 1px 6px;
      border: 1px solid var(--telelux-border, #e5e7eb);
      border-radius: 4px;
      background: var(--telelux-background, #ffffff);
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .pill button {
      border-radius: 999px;
    }

    button:hover,
    button[aria-expanded='true'] {
      background: var(--telelux-secondary, #f1f5f9);
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
      border: 1px solid var(--telelux-border, #e5e7eb);
      border-radius: var(--telelux-radius, 6px);
      background: var(--telelux-background, #ffffff);
      color: var(--telelux-foreground, #111827);
      box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
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
      color: var(--telelux-foreground, #111827);
      font-variant-numeric: tabular-nums;
    }

    .jump input {
      width: 6em;
      font: inherit;
    }

    ol {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      scroll-margin-top: 8px;
      border-radius: var(--telelux-radius, 6px);
    }

    li.highlight {
      outline: 2px solid var(--telelux-highlight, #f59e0b);
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
      box-shadow: 0 2px 6px rgb(0 0 0 / 12%);
    }

    kbd {
      margin-left: 4px;
      font-family: var(--telelux-font-mono, ui-monospace, monospace);
      font-size: 10px;
      color: var(--telelux-muted-foreground, #6b7280);
    }
  `;

  declare transcript: Transcript | undefined;
  declare annotations: unknown;
  declare format: string | undefined;
  private declare slotText: string | undefined;
  private declare metadataOpen: boolean;
  private declare copyStatus: string | undefined;
  private declare highlighted: number | undefined;

  #parsed: ParseResult | undefined;
  #current: number | undefined;
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
  }

  #readSlot = () => {
    const text = [...this.childNodes]
      .filter((node) => !(node instanceof Element && node.hasAttribute('slot')))
      .map((node) => node.textContent)
      .join('');
    this.slotText = text.trim() === '' ? undefined : text;
  };

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('transcript') || changed.has('slotText') || changed.has('format')) {
      this.#parsed = this.#parse();
      this.metadataOpen = false;
      this.highlighted = undefined;
      this.#current = undefined;
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
      return html`${this.#header(transcript)}<p class="empty">No messages.</p>`;
    }
    return html`${this.#header(transcript)}<ol>
      ${messages.map((message, index) => html`<li class=${index === this.highlighted ? 'highlight' : nothing}><telelux-message .message=${message} .index=${index}></telelux-message></li>`)}
    </ol>
    <nav class="block-nav" aria-label="Block navigation">
      <button class="previous" type="button" aria-label="Previous block" aria-keyshortcuts="k" @click=${() => this.#step(-1)}>Previous<kbd>K</kbd></button>
      <button class="next" type="button" aria-label="Next block" aria-keyshortcuts="j" @click=${() => this.#step(1)}>Next<kbd>J</kbd></button>
    </nav>`;
  }

  #header(transcript: Transcript) {
    const name = displayName(transcript.name);
    const createdAt = formatCreatedAt(transcript.created_at);
    const keys = definedEntries(transcript.metadata).length;
    const count = transcript.messages.length;
    return html`<header class="header" @keydown=${this.#onHeaderKeydown}>
      <slot name="before"></slot>
      <div class="identity">
        <span class="label">Transcript</span>
        <span class="pill"><code class="id">${transcript.id}</code><button class="copy" type="button" aria-label="Copy transcript id" @click=${() => this.#copy(transcript.id)}>${this.copyStatus ?? 'Copy'}</button></span>
        ${name === undefined ? nothing : html`<span class="name">${name}</span>`}
        ${createdAt === undefined ? nothing : html`<span class="created-at" title=${transcript.created_at as string}>${createdAt}</span>`}
        ${keys > 0 ? html`<button class="metadata-toggle" type="button" aria-haspopup="dialog" aria-expanded=${this.metadataOpen} @click=${() => (this.metadataOpen = !this.metadataOpen)}>Metadata (${keys})</button>` : nothing}
      </div>
      ${this.metadataOpen ? html`<div class="popover" role="dialog" aria-label="Transcript Metadata"><div class="popover-title">Transcript Metadata</div><telelux-metadata .metadata=${transcript.metadata}></telelux-metadata></div>` : nothing}
      ${this.#totals(transcript)}
      ${count === 0 ? nothing : html`<form class="jump" @submit=${(event: SubmitEvent) => this.#onJump(event, count)}>
        <span class="count">${count.toLocaleString()} ${count === 1 ? 'block' : 'blocks'}</span>
        <input name="block" type="number" min="0" max=${count - 1} placeholder="Block #" aria-label="Jump to block" />
      </form>`}
    </header>`;
  }

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

  #step(step: number) {
    const extents = this.#items().map((item) => item.getBoundingClientRect());
    const index = targetBlock(extents, window.innerHeight, this.#current, step);
    if (index !== undefined) {
      this.#goTo(index);
    }
  }

  #goTo(index: number) {
    this.#current = index;
    this.#items()[index].scrollIntoView({ block: 'start', behavior: 'smooth' });
    this.highlighted = index;
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
