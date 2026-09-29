import { css, html, LitElement, nothing, type PropertyValues } from 'lit';

import { stripScroll } from './strip-scroll';
import { theme } from './theme';
import type { ChatMessage } from './transcript';

export class TeleluxMinimap extends LitElement {
  static override properties = {
    messages: { attribute: false },
    current: { attribute: false },
    theme: { type: String, reflect: true },
    active: { state: true },
  };

  static override styles = [theme, css`
    :host {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--_muted-foreground);
    }

    .heading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 12px;
      margin-bottom: 4px;
    }

    .title {
      font-weight: 600;
      color: var(--_foreground);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .legend li {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .strip {
      position: relative;
      display: flex;
      gap: 2px;
      padding: 3px;
      overflow-x: auto;
    }

    .chip {
      position: relative;
      flex: none;
      width: 8px;
      height: 18px;
      padding: 0;
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }

    .chip:focus-visible {
      outline: 2px solid var(--_highlight);
      outline-offset: 1px;
    }

    .chip[aria-current='true'] {
      outline: 2px solid var(--_foreground);
      outline-offset: 1px;
    }

    .user {
      background: var(--_user-border);
    }

    .assistant {
      background: var(--_assistant-border);
    }

    .system {
      background: var(--_system-border);
    }

    .tool {
      background: var(--_tool-border);
    }

    .triangle {
      width: 8px;
      height: 7px;
      background: var(--_destructive);
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }

    .chip .triangle {
      position: absolute;
      top: 0;
      left: 0;
    }
  `];

  declare messages: ChatMessage[] | undefined;
  declare current: number | undefined;
  declare theme: string | undefined;
  private declare active: number | undefined;

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('messages')) {
      this.active = undefined;
    }
  }

  protected override updated(changed: PropertyValues) {
    const chip = this.current === undefined ? undefined : this.#chips()[this.current];
    if (changed.has('current') && chip !== undefined) {
      const strip = chip.parentElement as HTMLElement;
      strip.scrollLeft = stripScroll(chip.offsetLeft, chip.offsetWidth, strip.scrollLeft, strip.clientWidth);
    }
  }

  override render() {
    const messages = this.messages ?? [];
    const count = messages.length;
    const roving = this.active ?? this.current ?? 0;
    return html`<div class="heading">
        <span class="title">Minimap (${count.toLocaleString()} ${count === 1 ? 'message' : 'messages'})</span>
        <ul class="legend">
          <li><span class="dot system"></span>System</li>
          <li><span class="dot user"></span>User</li>
          <li><span class="dot assistant"></span>Assistant</li>
          <li><span class="dot tool"></span>Tool</li>
          <li><span class="triangle"></span>Error</li>
        </ul>
      </div>
      <div class="strip" role="toolbar" aria-label="Minimap" @keydown=${this.#onKeydown}>
        ${messages.map((message, index) => {
          const error = message.role === 'tool' && message.error !== undefined;
          const label = `Block ${index} ${message.role}${error ? ' error' : ''}`;
          return html`<button class="chip ${message.role}" type="button" tabindex=${index === roving ? 0 : -1} title=${label} aria-label=${label} aria-current=${index === this.current ? 'true' : nothing} @click=${() => this.#jump(index)}>${error ? html`<span class="triangle"></span>` : nothing}</button>`;
        })}
      </div>`;
  }

  #chips(): HTMLButtonElement[] {
    return [...this.renderRoot.querySelectorAll<HTMLButtonElement>('.chip')];
  }

  async #onKeydown(event: KeyboardEvent) {
    const chips = this.#chips();
    const from = chips.indexOf(event.target as HTMLButtonElement);
    const last = chips.length - 1;
    const to = ({ ArrowLeft: Math.max(from - 1, 0), ArrowRight: Math.min(from + 1, last), Home: 0, End: last } as Record<string, number | undefined>)[event.key];
    if (to === undefined) {
      return;
    }
    event.preventDefault();
    this.active = to;
    await this.updateComplete;
    chips[to].focus();
  }

  #jump(index: number) {
    this.active = index;
    this.dispatchEvent(new CustomEvent('telelux-jump', { detail: { index } }));
  }
}

customElements.define('telelux-minimap', TeleluxMinimap);
