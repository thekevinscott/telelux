import { css, html, LitElement, nothing } from 'lit';

import { messageText } from './message-text';
import { reasoningText } from './reasoning-text';
import { toolCallArguments } from './tool-call-arguments';
import type { ChatMessage, ToolCall } from './transcript';

export class TeleluxMessage extends LitElement {
  static override properties = {
    message: { attribute: false },
    index: { attribute: false },
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
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
      color: var(--telelux-muted-foreground, #6b7280);
    }

    .content,
    .reasoning-text,
    .code {
      font-family: var(--telelux-font-mono, ui-monospace, monospace);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .content {
      max-width: 100%;
      overflow-x: auto;
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

  override render() {
    const { message } = this;
    if (message === undefined) {
      return nothing;
    }
    const text = messageText(message.content);
    return html`<article class="block" data-role=${message.role}>
      <div class="header"><span class="label">Block ${this.index} | ${message.role.charAt(0).toUpperCase()}${message.role.slice(1)}</span><span class="controls"></span></div>
      ${this.#reasoning(message)}
      ${text === '' ? nothing : html`<div class="content">${text}</div>`}
      ${this.#images(message)}
      ${message.role === 'tool' ? this.#toolInfo(message) : nothing}
      ${message.role === 'assistant' ? (message.tool_calls ?? []).map((call) => this.#toolCall(call)) : nothing}
    </article>`;
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
