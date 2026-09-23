import { html, LitElement } from 'lit';

export class TeleLux extends LitElement {
  override render() {
    return html`hello world`;
  }
}

customElements.define('tele-lux', TeleLux);
