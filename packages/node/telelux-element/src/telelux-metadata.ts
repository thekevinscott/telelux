import { css, html, LitElement } from 'lit';

import { definedEntries } from './defined-entries';
import { theme } from './theme';
import type { Metadata } from './transcript';

type Value = NonNullable<Metadata[string]>;

export class TeleluxMetadata extends LitElement {
  static override properties = {
    metadata: { attribute: false },
    theme: { type: String, reflect: true },
  };

  static override styles = [theme, css`
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
      color: var(--_muted-foreground);
    }

    dd {
      margin: 0;
      font-family: var(--_font-mono);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    ul {
      margin: 0;
      padding-left: 16px;
    }

    dl dl {
      padding-left: 8px;
      border-left: 2px solid var(--_border);
    }
  `];

  declare metadata: Metadata | undefined;
  declare theme: string | undefined;

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
