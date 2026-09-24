import { afterEach, describe, expect, it } from 'vitest';

import { TeleluxTranscript } from './telelux-transcript';

describe('TeleluxTranscript', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-transcript tag', () => {
    expect(customElements.get('telelux-transcript')).toBe(TeleluxTranscript);
  });

  it('renders hello world in its shadow root once upgraded', async () => {
    const el = document.createElement('telelux-transcript') as TeleluxTranscript;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent?.trim()).toBe('hello world');
  });
});
