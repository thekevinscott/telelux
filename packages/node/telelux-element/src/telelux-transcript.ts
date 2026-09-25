import { html, LitElement, type PropertyValues } from 'lit';

import { messageText } from './message-text';
import { parseTranscript, type ParseResult, type Transcript } from './transcript';

export class TeleluxTranscript extends LitElement {
  static override properties = {
    transcript: { attribute: false },
    annotations: { attribute: false },
  };

  declare transcript: Transcript | undefined;
  declare annotations: unknown;

  #parsed: ParseResult | undefined;

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('transcript')) {
      this.#parsed = this.transcript == null ? undefined : parseTranscript(this.transcript);
    }
  }

  override render() {
    if (this.#parsed === undefined) {
      return html`<p class="empty">No transcript.</p>`;
    }
    if (!this.#parsed.ok) {
      return html`<pre class="error" role="alert">Invalid transcript:\n${this.#parsed.error}</pre>`;
    }
    const { messages } = this.#parsed.transcript;
    if (messages.length === 0) {
      return html`<p class="empty">No messages.</p>`;
    }
    return html`<ol>
      ${messages.map(
        (message) => html`<li><span class="role">${message.role}</span> ${messageText(message.content)}</li>`,
      )}
    </ol>`;
  }
}

customElements.define('telelux-transcript', TeleluxTranscript);
