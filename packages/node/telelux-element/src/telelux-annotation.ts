import { css, html, LitElement, nothing } from 'lit';

import { annotationStatus, sourceName } from './annotation-labels';
import type { Annotation } from './annotations';
import { theme } from './theme';

const STATUS_TEXT = { unresolved: 'Unresolved', confirmed: 'Confirmed', rejected: 'Rejected' };

export class TeleluxAnnotation extends LitElement {
  static override properties = {
    annotation: { attribute: false },
    span: { attribute: false },
    reason: { attribute: false },
    theme: { type: String, reflect: true },
  };

  static override styles = [theme, css`
    :host {
      display: block;
      font-family: var(--_font-sans);
      font-size: 12px;
      color: var(--_foreground);
    }

    article {
      --status: var(--_highlight);
      padding: 6px 8px;
      border: 1px solid var(--_border);
      border-left: 4px solid var(--status);
      border-radius: var(--_radius);
      background: var(--_secondary);
    }

    article[data-status='confirmed'] {
      --status: var(--_destructive);
    }

    article[data-status='rejected'] {
      --status: var(--_muted-foreground);
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 4px 10px;
    }

    .label {
      font-weight: 600;
    }

    .source,
    .status,
    .span,
    .reason {
      color: var(--_muted-foreground);
    }

    .confidence {
      font-variant-numeric: tabular-nums;
    }

    p {
      margin: 4px 0 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .summary {
      font-weight: 500;
    }

    .resolve {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 4px;
      margin-top: 6px;
    }

    textarea {
      flex: 1 1 16em;
      min-height: 2em;
      border: 1px solid var(--_border);
      border-radius: var(--_radius-sm);
      background: var(--_background);
      font: inherit;
      color: inherit;
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

    button:hover {
      background: var(--_muted);
    }
  `];

  declare annotation: Annotation | undefined;
  declare span: { start: number; end: number } | undefined;
  declare reason: string | undefined;
  declare theme: string | undefined;

  override render() {
    const { annotation } = this;
    if (annotation === undefined) {
      return nothing;
    }
    const status = annotationStatus(annotation);
    const by = annotation.resolution?.by;
    return html`<article part="annotation" data-status=${status} aria-label="Annotation ${annotation.label}">
      <header>
        <span class="label">${annotation.label}</span>
        ${annotation.confidence === undefined ? nothing : html`<span class="confidence">${Math.round(annotation.confidence * 100)}%</span>`}
        <span class="source">${sourceName(annotation.source)}</span>
        <span class="status">${STATUS_TEXT[status]}${by === undefined ? '' : ` by ${by}`}</span>
        ${this.span !== undefined && this.span.end > this.span.start ? html`<span class="span">Blocks ${this.span.start}–${this.span.end}</span>` : nothing}
      </header>
      ${annotation.summary === undefined ? nothing : html`<p class="summary">${annotation.summary}</p>`}
      ${annotation.note === undefined ? nothing : html`<p class="note">${annotation.note}</p>`}
      ${this.reason === undefined ? nothing : html`<p class="reason">${this.reason}</p>`}
      ${annotation.resolution?.note === undefined ? nothing : html`<p class="resolution-note">${annotation.resolution.note}</p>`}
      <div class="resolve">
        ${status === 'unresolved'
          ? html`<textarea aria-label="Review note" placeholder="Review note"></textarea><button class="confirm" type="button" @click=${() => this.#resolve('confirmed')}>Confirm</button><button class="reject" type="button" @click=${() => this.#resolve('rejected')}>Reject</button>`
          : html`<button class="reopen" type="button" @click=${() => this.#resolve(undefined)}>Reopen</button>`}
      </div>
    </article>`;
  }

  #resolve(state: 'confirmed' | 'rejected' | undefined) {
    const note = this.renderRoot.querySelector('textarea')?.value;
    this.dispatchEvent(new CustomEvent('telelux-resolve', { bubbles: true, composed: true, detail: { id: (this.annotation as Annotation).id, state, note } }));
  }
}

customElements.define('telelux-annotation', TeleluxAnnotation);
