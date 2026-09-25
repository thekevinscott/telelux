import { html, LitElement, type PropertyValues } from 'lit';

import { messageText } from './message-text';
import { parseRawTranscript } from './parse-raw-transcript';
import { parseTranscript, type ParseResult, type Transcript } from './transcript';

export class TeleluxTranscript extends LitElement {
  static override properties = {
    transcript: { attribute: false },
    annotations: { attribute: false },
    format: { type: String },
    slotText: { state: true },
  };

  declare transcript: Transcript | undefined;
  declare annotations: unknown;
  declare format: string | undefined;
  private declare slotText: string | undefined;

  #parsed: ParseResult | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.#readSlot();
  }

  #readSlot = () => {
    const text = this.textContent as string;
    this.slotText = text.trim() === '' ? undefined : text;
  };

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('transcript') || changed.has('slotText') || changed.has('format')) {
      this.#parsed = this.#parse();
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
