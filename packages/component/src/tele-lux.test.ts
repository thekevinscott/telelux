import { afterEach, describe, expect, it } from 'vitest';

import { TeleLux } from './tele-lux';

describe('TeleLux', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the tele-lux tag', () => {
    expect(customElements.get('tele-lux')).toBe(TeleLux);
  });

  it('renders hello world in its shadow root once upgraded', async () => {
    const el = document.createElement('tele-lux') as TeleLux;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent?.trim()).toBe('hello world');
  });
});
