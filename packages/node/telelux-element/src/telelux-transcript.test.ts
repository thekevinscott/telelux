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

vi.mock('./parse-raw-transcript', async () => {
  const actual = await vi.importActual<typeof import('./parse-raw-transcript')>('./parse-raw-transcript');
  const parseRawTranscript = vi.fn<typeof actual.parseRawTranscript>((text, options = {}) => {
    if (options.format !== undefined && options.format !== 'claude-code') {
      return { ok: false, error: `Unknown transcript format "${options.format}".` };
    }
    if (!text.trim().startsWith('{')) {
      return { ok: false, error: 'Could not detect the transcript format.' };
    }
    const messages = text
      .split('\n')
      .filter((line) => line !== '')
      .map((line) => ({ role: 'user' as const, content: `${options.format ?? 'sniffed'}: ${line}` }));
    return { ok: true, transcript: { id: 'slot', metadata: {}, messages } };
  });
  return { ...actual, parseRawTranscript };
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

async function mount(children = ''): Promise<TeleluxTranscript> {
  const el = document.createElement('telelux-transcript') as TeleluxTranscript;
  el.innerHTML = children;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

async function settle(el: TeleluxTranscript): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

const plain = (jsonl: string) => `<script type="text/plain">${jsonl}</script>`;

function text(el: TeleluxTranscript): string {
  return el.shadowRoot?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function items(el: TeleluxTranscript): string[] {
  return [...(el.shadowRoot?.querySelectorAll('li') ?? [])].map((li) => li.textContent?.trim() ?? '');
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

    it('ignores a transcript attribute', async () => {
      const el = await mount();
      el.setAttribute('transcript', JSON.stringify(transcript));
      await el.updateComplete;
      expect(el.transcript).toBeUndefined();
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

  describe('with raw text in the default slot', () => {
    it('parses a plain-text script child and renders its messages', async () => {
      const el = await mount(plain('{"a":1}\n{"b":2}'));
      expect(items(el)).toEqual(['user sniffed: {"a":1}', 'user sniffed: {"b":2}']);
      expect(el.shadowRoot?.querySelector('slot')?.hasAttribute('hidden')).toBe(true);
    });

    it('passes the format attribute to the parser', async () => {
      const el = document.createElement('telelux-transcript') as TeleluxTranscript;
      el.setAttribute('format', 'claude-code');
      el.innerHTML = plain('{"a":1}');
      document.body.appendChild(el);
      await settle(el);
      expect(text(el)).toBe('user claude-code: {"a":1}');
    });

    it('accepts bare text', async () => {
      const el = await mount('{"a":1}');
      expect(text(el)).toBe('user sniffed: {"a":1}');
    });

    it('treats whitespace-only content as no transcript', async () => {
      const el = await mount('\n  \n');
      expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('No transcript.');
    });

    it('re-parses when the slotted content changes', async () => {
      const el = await mount(plain('{"a":1}'));
      el.innerHTML = plain('{"b":2}');
      await settle(el);
      expect(text(el)).toBe('user sniffed: {"b":2}');
    });

    it('re-parses when the format attribute changes', async () => {
      const el = await mount(plain('{"a":1}'));
      el.setAttribute('format', 'claude-code');
      await settle(el);
      expect(text(el)).toBe('user claude-code: {"a":1}');
    });

    it('does not re-parse when an unrelated property changes', async () => {
      const el = await mount(plain('{"a":1}'));
      const { parseRawTranscript } = await import('./parse-raw-transcript');
      const calls = vi.mocked(parseRawTranscript).mock.calls.length;
      el.annotations = [];
      await settle(el);
      expect(vi.mocked(parseRawTranscript).mock.calls.length).toBe(calls);
    });

    it('lets the transcript property win over the slot', async () => {
      const el = await mount(plain('{"a":1}'));
      el.transcript = transcript;
      await settle(el);
      expect(items(el)).toEqual(['user first message', 'assistant [content]']);
    });

    it('falls back to the slot when the property is cleared', async () => {
      const el = await mount(plain('{"a":1}'));
      el.transcript = transcript;
      await settle(el);
      el.transcript = undefined;
      await settle(el);
      expect(text(el)).toBe('user sniffed: {"a":1}');
    });

    it('renders the error state for an unknown format', async () => {
      const el = document.createElement('telelux-transcript') as TeleluxTranscript;
      el.setAttribute('format', 'nope');
      el.innerHTML = plain('{"a":1}');
      document.body.appendChild(el);
      await settle(el);
      expect(el.shadowRoot?.querySelector('.error')?.textContent).toBe('Invalid transcript:\nUnknown transcript format "nope".');
    });

    it('renders the error state when the slot fails to parse', async () => {
      const el = await mount(plain('not a transcript'));
      const error = el.shadowRoot?.querySelector('.error');
      expect(error?.getAttribute('role')).toBe('alert');
      expect(error?.textContent).toBe('Invalid transcript:\nCould not detect the transcript format.');
      expect(el.shadowRoot?.querySelector('li')).toBeNull();
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
