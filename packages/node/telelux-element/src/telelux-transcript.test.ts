import { afterEach, describe, expect, it, vi } from 'vitest';

import { TeleluxTranscript } from './telelux-transcript';
import type { Transcript } from './transcript';

vi.mock('./transcript', async () => {
  const actual = await vi.importActual<typeof import('./transcript')>('./transcript');
  const parseTranscript: typeof actual.parseTranscript = (value) => {
    const candidate = value as { messages?: unknown };
    return Array.isArray(candidate.messages)
      ? { ok: true, transcript: value as Transcript }
      : { ok: false, error: 'messages: expected array' };
  };
  return { ...actual, parseTranscript };
});

vi.mock('./message-text', async () => {
  const actual = await vi.importActual<typeof import('./message-text')>('./message-text');
  const messageText: typeof actual.messageText = (content) => (typeof content === 'string' ? content : '[content]');
  return { ...actual, messageText };
});

const transcript: Transcript = {
  id: 't1',
  metadata: {},
  messages: [
    { role: 'user', content: 'first message' },
    { role: 'assistant', content: [{ type: 'text', text: 'second' }] },
  ],
};

async function mount(): Promise<TeleluxTranscript> {
  const el = document.createElement('telelux-transcript') as TeleluxTranscript;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function text(el: TeleluxTranscript): string {
  return el.shadowRoot?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('TeleluxTranscript', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-transcript tag', () => {
    expect(customElements.get('telelux-transcript')).toBe(TeleluxTranscript);
  });

  describe('with no transcript set', () => {
    it('renders the empty state', async () => {
      const el = await mount();
      expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('No transcript.');
    });
  });

  describe('when transcript is set', () => {
    it('renders one item per message with its role and text', async () => {
      const el = await mount();
      el.transcript = transcript;
      await el.updateComplete;
      const items = [...(el.shadowRoot?.querySelectorAll('li') ?? [])];
      expect(items.map((li) => li.textContent?.trim())).toEqual(['user first message', 'assistant [content]']);
      expect(items[0]?.querySelector('.role')?.textContent).toBe('user');
    });

    it('accepts the property before the element is upgraded', async () => {
      const el = document.createElement('telelux-transcript') as TeleluxTranscript;
      el.transcript = transcript;
      document.body.appendChild(el);
      await el.updateComplete;
      expect(text(el)).toContain('first message');
    });

    it('re-renders when the property is set again', async () => {
      const el = await mount();
      el.transcript = transcript;
      await el.updateComplete;
      el.transcript = { ...transcript, messages: [{ role: 'system', content: 'replaced' }] };
      await el.updateComplete;
      expect(text(el)).toBe('system replaced');
    });

    it('renders transcript text as text, never as markup', async () => {
      const el = await mount();
      el.transcript = { ...transcript, messages: [{ role: 'user', content: '<b>bold</b>' }] };
      await el.updateComplete;
      expect(el.shadowRoot?.querySelector('b')).toBeNull();
      expect(text(el)).toBe('user <b>bold</b>');
    });

    it('renders the empty state for a transcript with no messages', async () => {
      const el = await mount();
      el.transcript = { ...transcript, messages: [] };
      await el.updateComplete;
      expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('No messages.');
      expect(el.shadowRoot?.querySelector('ol')).toBeNull();
    });

    it('returns to the empty state when the property is cleared', async () => {
      const el = await mount();
      el.transcript = transcript;
      await el.updateComplete;
      el.transcript = undefined;
      await el.updateComplete;
      expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('No transcript.');
    });
  });

  describe('when transcript fails the runtime check', () => {
    it('renders the error state with the parser message and does not throw', async () => {
      const el = await mount();
      el.transcript = { id: 'x' } as unknown as Transcript;
      await el.updateComplete;
      const error = el.shadowRoot?.querySelector('.error');
      expect(error?.getAttribute('role')).toBe('alert');
      expect(error?.textContent).toBe('Invalid transcript:\nmessages: expected array');
      expect(el.shadowRoot?.querySelector('li')).toBeNull();
    });

    it('recovers when a valid transcript replaces it', async () => {
      const el = await mount();
      el.transcript = 'garbage' as unknown as Transcript;
      await el.updateComplete;
      el.transcript = transcript;
      await el.updateComplete;
      expect(el.shadowRoot?.querySelector('.error')).toBeNull();
      expect(text(el)).toContain('first message');
    });
  });

  describe('annotations', () => {
    it('stores the property without rendering it', async () => {
      const el = await mount();
      el.transcript = transcript;
      el.annotations = [{ label: 'cheating', note: 'suspicious' }];
      await el.updateComplete;
      expect(el.annotations).toEqual([{ label: 'cheating', note: 'suspicious' }]);
      expect(text(el)).not.toContain('suspicious');
    });
  });
});
