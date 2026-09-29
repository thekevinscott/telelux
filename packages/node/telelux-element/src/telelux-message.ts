import { css, html, LitElement, nothing, type PropertyValues } from 'lit';

import './telelux-metadata';
import { definedEntries } from './defined-entries';
import { messageText } from './message-text';
import { prettyJson } from './pretty-json';
import { reasoningText } from './reasoning-text';
import { textSegments } from './text-segments';
import { toolCallArguments } from './tool-call-arguments';
import type { ChatMessage, ToolCall } from './transcript';

const documentIcon = html`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 1.5h5.5L12.5 4.5v10h-8.5z" /><path d="M9.5 1.5v3h3M6 8h4.5M6 10.5h4.5" /></svg>`;

export class TeleluxMessage extends LitElement {
  static override properties = {
    message: { attribute: false },
    index: { attribute: false },
    formatted: { state: true },
    metadataOpen: { state: true },
    rawOpen: { state: true },
  };

  static override styles = css`
    :host {
      display: block;
      font-family: var(--telelux-font-sans, system-ui, sans-serif);
      font-size: 14px;
    }

    .block {
      --border: var(--telelux-unknown-border, #d1d5db);
      --background: var(--telelux-unknown-background, #f9fafb);
      border-left: 4px solid var(--border);
      background: var(--background);
      border-radius: var(--telelux-radius, 6px);
      padding: 8px;
    }

    .block[data-role='user'] {
      --border: var(--telelux-user-border, #d1d5db);
      --background: var(--telelux-user-background, #f9fafb);
    }

    .block[data-role='assistant'] {
      --border: var(--telelux-assistant-border, #93c5fd);
      --background: var(--telelux-assistant-background, #eff6ff);
    }

    .block[data-role='system'] {
      --border: var(--telelux-system-border, #fdba74);
      --background: var(--telelux-system-background, #fff7ed);
    }

    .block[data-role='tool'] {
      --border: var(--telelux-tool-border, #86efac);
      --background: var(--telelux-tool-background, #f0fdf4);
    }

    .header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .controls {
      display: flex;
      gap: 4px;
    }

    .controls button {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 1px 4px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: none;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .controls button:hover,
    .controls button[aria-pressed='true'],
    .controls button[aria-expanded='true'] {
      border-color: var(--telelux-border, #e5e7eb);
      background: var(--telelux-secondary, #f1f5f9);
    }

    .controls svg {
      width: 10px;
      height: 10px;
    }

    .popover {
      position: absolute;
      top: 100%;
      right: 0;
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
      font-size: 12px;
      font-weight: 600;
    }

    .content,
    .reasoning-text,
    .code,
    .fence,
    .raw {
      font-family: var(--telelux-font-mono, ui-monospace, monospace);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .content {
      max-width: 100%;
      overflow-x: auto;
      font-size: 12px;
    }

    .content.formatted {
      font-family: var(--telelux-font-sans, system-ui, sans-serif);
      font-size: 13px;
    }

    .fence,
    .raw {
      margin: 4px 0;
      padding: 6px;
      border-radius: 4px;
      background: var(--telelux-secondary, #f1f5f9);
      font-size: 12px;
    }

    .reasoning {
      margin-bottom: 8px;
      padding: 8px;
      border-left: 2px solid var(--telelux-border, #e5e7eb);
      border-radius: 4px;
      background: var(--telelux-muted, #f3f4f6);
      font-size: 12px;
    }

    .reasoning summary {
      cursor: pointer;
      list-style: none;
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .reasoning summary::-webkit-details-marker {
      display: none;
    }

    .reasoning summary::before {
      content: '▸ ';
    }

    .reasoning[open] summary::before {
      content: '▾ ';
    }

    .reasoning-text {
      margin-top: 4px;
      font-style: italic;
    }

    .image {
      margin-top: 4px;
      font-size: 12px;
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .tool-call {
      margin-top: 4px;
      padding: 6px;
      border-radius: 4px;
      background: var(--telelux-secondary, #f1f5f9);
      font-size: 12px;
    }

    .tool-call .id {
      margin-bottom: 2px;
      font-size: 10px;
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .arguments {
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .tool-info {
      margin-top: 4px;
      font-size: 10px;
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .tool-info span + span {
      margin-left: 8px;
    }

    .tool-info .error {
      margin-top: 4px;
      color: var(--telelux-destructive, #dc2626);
    }
  `;

  declare message: ChatMessage | undefined;
  declare index: number | undefined;
  private declare formatted: boolean;
  private declare metadataOpen: boolean;
  private declare rawOpen: boolean;

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('message')) {
      this.formatted = false;
      this.metadataOpen = false;
      this.rawOpen = false;
    }
  }

  override render() {
    const { message } = this;
    if (message === undefined) {
      return nothing;
    }
    const text = messageText(message.content);
    const metadata = definedEntries(message.metadata).length > 0;
    return html`<article class="block" data-role=${message.role} @keydown=${this.#onKeydown}>
      <div class="header"><span class="label">Block ${this.index} | ${message.role.charAt(0).toUpperCase()}${message.role.slice(1)}</span><span class="controls">
        <button class="text-mode" type="button" aria-pressed=${this.formatted} aria-label="Formatted text" title="Formatted text" @click=${() => (this.formatted = !this.formatted)}>文A</button>
        ${metadata ? html`<button class="metadata-toggle" type="button" aria-haspopup="dialog" aria-expanded=${this.metadataOpen} @click=${() => (this.metadataOpen = !this.metadataOpen)}>${documentIcon}Metadata</button>` : nothing}
        <button class="raw-toggle" type="button" aria-pressed=${this.rawOpen} @click=${() => (this.rawOpen = !this.rawOpen)}>Raw</button>
      </span>${metadata && this.metadataOpen ? this.#popover(message) : nothing}</div>
      ${this.#reasoning(message)}
      ${text === '' ? nothing : this.#content(text)}
      ${this.#images(message)}
      ${message.role === 'tool' ? this.#toolInfo(message) : nothing}
      ${message.role === 'assistant' ? (message.tool_calls ?? []).map((call) => this.#toolCall(call)) : nothing}
      ${this.rawOpen ? html`<pre class="raw">${JSON.stringify(message, null, 2)}</pre>` : nothing}
    </article>`;
  }

  #onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.metadataOpen) {
      this.metadataOpen = false;
      (this.renderRoot.querySelector('.metadata-toggle') as HTMLButtonElement).focus();
    }
  }

  #popover(message: ChatMessage) {
    const title = `Message Metadata - Block ${this.index}`;
    return html`<div class="popover" role="dialog" aria-label=${title}><div class="popover-title">${title}</div><telelux-metadata .metadata=${message.metadata}></telelux-metadata></div>`;
  }

  #content(text: string) {
    if (!this.formatted) {
      return html`<div class="content">${text}</div>`;
    }
    const json = prettyJson(text);
    if (json !== undefined) {
      return html`<div class="content">${json}</div>`;
    }
    return html`<div class="content formatted">${textSegments(text).map((segment) => (segment.code ? html`<pre class="fence">${segment.text}</pre>` : segment.text))}</div>`;
  }

  #reasoning(message: ChatMessage) {
    const reasoning = reasoningText(message.content);
    if (!reasoning) {
      return nothing;
    }
    return html`<details class="reasoning" open><summary>Reasoning</summary><div class="reasoning-text">${reasoning}</div></details>`;
  }

  #images(message: ChatMessage) {
    if (typeof message.content === 'string') {
      return nothing;
    }
    return message.content
      .filter((item) => item.type === 'image')
      .map(() => html`<div class="image">[image]</div>`);
  }

  #toolInfo(message: Extract<ChatMessage, { role: 'tool' }>) {
    const { tool_call_id: id, function: name, error } = message;
    if (id === undefined && name === undefined && error === undefined) {
      return nothing;
    }
    return html`<div class="tool-info">${id === undefined ? nothing : html`<span>Tool Call ID: ${id}</span>`}${name === undefined ? nothing : html`<span>Function: ${name}</span>`}${error === undefined ? nothing : html`<div class="error">Error: ${error.message}</div>`}</div>`;
  }

  #toolCall(call: ToolCall) {
    const body = call.view === undefined
      ? html`<b class="function">${call.function}</b><span class="arguments">(${toolCallArguments(call.arguments)})</span>`
      : call.view.content;
    return html`<div class="tool-call"><div class="id">Tool Call ID: ${call.id}</div><div class="code">${body}</div></div>`;
  }
}

customElements.define('telelux-message', TeleluxMessage);
