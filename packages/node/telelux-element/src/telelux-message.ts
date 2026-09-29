import { css, html, LitElement, nothing, type PropertyValues } from 'lit';

import './telelux-metadata';
import { definedEntries } from './defined-entries';
import { messageText } from './message-text';
import { prettyJson } from './pretty-json';
import { reasoningText } from './reasoning-text';
import { textSegments } from './text-segments';
import { theme } from './theme';
import { toolCallArguments } from './tool-call-arguments';
import type { ChatMessage, ToolCall } from './transcript';

const documentIcon = html`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 1.5h5.5L12.5 4.5v10h-8.5z" /><path d="M9.5 1.5v3h3M6 8h4.5M6 10.5h4.5" /></svg>`;

export class TeleluxMessage extends LitElement {
  static override properties = {
    message: { attribute: false },
    index: { attribute: false },
    theme: { type: String, reflect: true },
    formatted: { state: true },
    metadataOpen: { state: true },
    rawOpen: { state: true },
  };

  static override styles = [theme, css`
    :host {
      display: block;
      font-family: var(--_font-sans);
      font-size: var(--_font-size);
      color: var(--_foreground);
    }

    .block {
      --border: var(--_unknown-border);
      --background: var(--_unknown-background);
      border-left: 4px solid var(--border);
      background: var(--background);
      border-radius: var(--_radius);
      padding: var(--_block-padding);
    }

    .block[data-role='user'] {
      --border: var(--_user-border);
      --background: var(--_user-background);
    }

    .block[data-role='assistant'] {
      --border: var(--_assistant-border);
      --background: var(--_assistant-background);
    }

    .block[data-role='system'] {
      --border: var(--_system-border);
      --background: var(--_system-background);
    }

    .block[data-role='tool'] {
      --border: var(--_tool-border);
      --background: var(--_tool-background);
    }

    .header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
      color: var(--_muted-foreground);
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
      border-radius: var(--_radius-sm);
      background: none;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .controls button:hover,
    .controls button[aria-pressed='true'],
    .controls button[aria-expanded='true'] {
      border-color: var(--_border);
      background: var(--_secondary);
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
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      background: var(--_background);
      color: var(--_foreground);
      box-shadow: 0 4px 12px var(--_shadow);
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
      font-family: var(--_font-mono);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .content {
      max-width: 100%;
      overflow-x: auto;
      font-size: 12px;
    }

    .content.formatted {
      font-family: var(--_font-sans);
      font-size: 13px;
    }

    .fence,
    .raw {
      margin: 4px 0;
      padding: 6px;
      border-radius: var(--_radius-sm);
      background: var(--_secondary);
      font-size: 12px;
    }

    .reasoning {
      margin-bottom: 8px;
      padding: 8px;
      border-left: 2px solid var(--_border);
      border-radius: var(--_radius-sm);
      background: var(--_muted);
      font-size: 12px;
    }

    .reasoning summary {
      cursor: pointer;
      list-style: none;
      color: var(--_muted-foreground);
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
      color: var(--_muted-foreground);
    }

    .tool-call {
      margin-top: 4px;
      padding: 6px;
      border-radius: var(--_radius-sm);
      background: var(--_secondary);
      font-size: 12px;
    }

    .tool-call .id {
      margin-bottom: 2px;
      font-size: 10px;
      color: var(--_muted-foreground);
    }

    .arguments {
      color: var(--_muted-foreground);
    }

    .tool-info {
      margin-top: 4px;
      font-size: 10px;
      color: var(--_muted-foreground);
    }

    .tool-info span + span {
      margin-left: 8px;
    }

    .tool-info .error {
      margin-top: 4px;
      color: var(--_destructive);
    }
  `];

  declare message: ChatMessage | undefined;
  declare index: number | undefined;
  declare theme: string | undefined;
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
    return html`<article class="block" part="block block-${message.role}" data-role=${message.role} @keydown=${this.#onKeydown}>
      <div class="header" part="header"><span class="label">Block ${this.index} | ${message.role.charAt(0).toUpperCase()}${message.role.slice(1)}</span><span class="controls">
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
    return html`<div class="popover" role="dialog" aria-label=${title}><div class="popover-title">${title}</div><telelux-metadata theme=${this.theme ?? nothing} .metadata=${message.metadata}></telelux-metadata></div>`;
  }

  #content(text: string) {
    if (!this.formatted) {
      return html`<div class="content" part="content">${text}</div>`;
    }
    const json = prettyJson(text);
    if (json !== undefined) {
      return html`<div class="content" part="content">${json}</div>`;
    }
    return html`<div class="content formatted" part="content">${textSegments(text).map((segment) => (segment.code ? html`<pre class="fence">${segment.text}</pre>` : segment.text))}</div>`;
  }

  #reasoning(message: ChatMessage) {
    const reasoning = reasoningText(message.content);
    if (!reasoning) {
      return nothing;
    }
    return html`<details class="reasoning" part="reasoning" open><summary>Reasoning</summary><div class="reasoning-text">${reasoning}</div></details>`;
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
    return html`<div class="tool-call" part="tool-call"><div class="id">Tool Call ID: ${call.id}</div><div class="code">${body}</div></div>`;
  }
}

customElements.define('telelux-message', TeleluxMessage);
