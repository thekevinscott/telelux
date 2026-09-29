import { css, html, LitElement } from 'lit';

import { definedEntries } from './defined-entries';
import type { Metadata } from './transcript';

type Value = NonNullable<Metadata[string]>;

export class TeleluxMetadata extends LitElement {
  static override properties = {
    metadata: { attribute: false },
  };

  static override styles = css`
    :host {
      display: block;
      font-size: 12px;
    }

    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 2px 12px;
      margin: 0;
    }

    dt {
      color: var(--telelux-muted-foreground, #6b7280);
    }

    dd {
      margin: 0;
      font-family: var(--telelux-font-mono, ui-monospace, monospace);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    ul {
      margin: 0;
      padding-left: 16px;
    }

    dl dl {
      padding-left: 8px;
      border-left: 2px solid var(--telelux-border, #e5e7eb);
    }
  `;

  declare metadata: Metadata | undefined;

  override render() {
    const entries = definedEntries(this.metadata);
    if (entries.length === 0) {
      return html`<p class="empty">No metadata.</p>`;
    }
    return html`<dl>${entries.map(([key, value]) => html`<dt>${key}</dt><dd>${this.#value(value)}</dd>`)}</dl>`;
  }

  #value(value: Value) {
    if (Array.isArray(value)) {
      return html`<ul>${value.map((item) => html`<li>${String(item)}</li>`)}</ul>`;
    }
    if (typeof value === 'object') {
      return html`<dl>${definedEntries(value).map(([key, leaf]) => html`<dt>${key}</dt><dd>${Array.isArray(leaf) ? JSON.stringify(leaf) : String(leaf)}</dd>`)}</dl>`;
    }
    return String(value);
  }
}

customElements.define('telelux-metadata', TeleluxMetadata);
