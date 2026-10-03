import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Annotation, AnnotationSidecar } from './annotations';
import { downloadJson } from './download-json';
import { resolveAnnotations } from './resolve-annotations';
import type { TeleluxAnnotation } from './telelux-annotation';
import type { TeleluxMessage } from './telelux-message';
import type { TeleluxMetadata } from './telelux-metadata';
import type { TeleluxMinimap } from './telelux-minimap';
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

vi.mock('./download-json', async () => {
  const actual = await vi.importActual<typeof import('./download-json')>('./download-json');
  return { ...actual, downloadJson: vi.fn<typeof actual.downloadJson>() };
});

vi.mock('./resolve-annotations', async () => {
  const actual = await vi.importActual<typeof import('./resolve-annotations')>('./resolve-annotations');
  return { ...actual, resolveAnnotations: vi.fn(actual.resolveAnnotations) };
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

const text = (el: TeleluxTranscript, selector: string) => el.shadowRoot?.querySelector(selector)?.textContent?.trim();

const plain = (jsonl: string) => `<script type="text/plain">${jsonl}</script>`;

function blocks(el: TeleluxTranscript): TeleluxMessage[] {
  return [...(el.shadowRoot?.querySelectorAll<TeleluxMessage>('li > telelux-message') ?? [])];
}

function items(el: TeleluxTranscript): string[] {
  return blocks(el).map(({ message }) => `${message?.role} ${typeof message?.content === 'string' ? message.content : '[content]'}`);
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
    it('renders one block per message, in order, with its index', async () => {
      const el = await mount();
      el.transcript = transcript;
      await el.updateComplete;
      expect(blocks(el).map(({ message }) => message)).toEqual(transcript.messages);
      expect(blocks(el).map(({ index }) => index)).toEqual([0, 1]);
    });

    it('accepts the property before the element is upgraded', async () => {
      const el = document.createElement('telelux-transcript') as TeleluxTranscript;
      el.transcript = transcript;
      document.body.appendChild(el);
      await el.updateComplete;
      expect(items(el)).toEqual(['user first message', 'assistant [content]']);
    });

    it('re-renders when the property is set again', async () => {
      const el = await mount();
      el.transcript = transcript;
      await el.updateComplete;
      el.transcript = { ...transcript, messages: [{ role: 'system', content: 'replaced' }] };
      await el.updateComplete;
      expect(items(el)).toEqual(['system replaced']);
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
      expect(items(el)).toEqual(['user first message', 'assistant [content]']);
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
      expect(items(el)).toEqual(['user claude-code: {"a":1}']);
    });

    it('accepts bare text', async () => {
      const el = await mount('{"a":1}');
      expect(items(el)).toEqual(['user sniffed: {"a":1}']);
    });

    it('treats whitespace-only content as no transcript', async () => {
      const el = await mount('\n  \n');
      expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('No transcript.');
    });

    it('re-parses when the slotted content changes', async () => {
      const el = await mount(plain('{"a":1}'));
      el.innerHTML = plain('{"b":2}');
      await settle(el);
      expect(items(el)).toEqual(['user sniffed: {"b":2}']);
    });

    it('re-parses when the format attribute changes', async () => {
      const el = await mount(plain('{"a":1}'));
      el.setAttribute('format', 'claude-code');
      await settle(el);
      expect(items(el)).toEqual(['user claude-code: {"a":1}']);
    });

    it('does not re-parse when an unrelated property changes', async () => {
      const el = await mount(plain('{"a":1}'));
      const { parseRawTranscript } = await import('./parse-raw-transcript');
      const calls = vi.mocked(parseRawTranscript).mock.calls.length;
      el.annotations = { version: 1, annotations: [] };
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
      expect(items(el)).toEqual(['user sniffed: {"a":1}']);
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
    const four: Transcript = {
      id: 't1',
      metadata: {},
      messages: ['zero', 'one', 'two', 'three'].map((content) => ({ role: 'user' as const, content })),
    };
    const note = (id: string, start: number, extra: Partial<Annotation> = {}): Annotation => ({
      id,
      target: { start: { index: start } },
      label: 'cheating',
      source: { kind: 'judge' },
      ...extra,
    });
    const sidecar: AnnotationSidecar = {
      version: 1,
      transcript_id: 't1',
      annotations: [
        note('a', 1, { target: { start: { index: 1 }, end: { index: 3 } } }),
        note('b', 1, { label: 'honest', source: { kind: 'human', name: 'kevin' } }),
        note('c', 2, { resolution: { state: 'confirmed' } }),
        note('lost', 9),
      ],
    };

    async function annotated(annotations: unknown = sidecar): Promise<TeleluxTranscript> {
      const el = await mount();
      el.transcript = four;
      el.annotations = annotations as AnnotationSidecar;
      await settle(el);
      return el;
    }

    const cards = (root: ParentNode | null | undefined) => [...(root?.querySelectorAll<TeleluxAnnotation>('telelux-annotation') ?? [])];
    const inline = (el: TeleluxTranscript) => blocks(el).map((block) => cards(block.parentElement).map(({ annotation }) => annotation?.id));
    const unanchored = (el: TeleluxTranscript) => cards(el.shadowRoot?.querySelector('.unanchored'));
    const panel = (el: TeleluxTranscript) => el.shadowRoot?.querySelector<HTMLElement>('.annotations');
    const select = (el: TeleluxTranscript, name: string) => el.shadowRoot?.querySelector<HTMLSelectElement>(`select.${name}`) as HTMLSelectElement;

    async function choose(el: TeleluxTranscript, name: string, value: string) {
      const control = select(el, name);
      control.value = value;
      control.dispatchEvent(new Event('change'));
      await settle(el);
    }

    function resolve(card: TeleluxAnnotation, detail: { id: string; state: 'confirmed' | 'rejected' | undefined; note?: string }) {
      card.dispatchEvent(new CustomEvent('telelux-resolve', { bubbles: true, composed: true, detail }));
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders no panel without annotations', async () => {
      const el = await annotated(null);
      expect(panel(el)).toBeNull();
      expect(el.shadowRoot?.querySelector('.annotations-error')).toBeNull();
      el.annotations = undefined;
      await settle(el);
      expect(panel(el)).toBeNull();
      expect(el.shadowRoot?.querySelector('.annotations-error')).toBeNull();
      expect(cards(el.shadowRoot)).toEqual([]);
    });

    it('shows the parse error and still renders the transcript', async () => {
      const el = await annotated({ version: 2, annotations: [] });
      const error = el.shadowRoot?.querySelector('.annotations-error');
      expect(error?.getAttribute('role')).toBe('alert');
      expect(error?.textContent).toMatch(/^Invalid annotations:\n✖ /);
      expect(panel(el)).toBeNull();
      expect(blocks(el)).toHaveLength(4);
    });

    it('clears the parse error when valid annotations arrive', async () => {
      const el = await annotated({ version: 2, annotations: [] });
      el.annotations = sidecar;
      await settle(el);
      expect(el.shadowRoot?.querySelector('.annotations-error')).toBeNull();
      expect(panel(el)?.getAttribute('part')).toBe('annotations');
    });

    it('renders each annotation under the block its start anchor resolves to', async () => {
      const el = await annotated();
      expect(inline(el)).toEqual([[], ['a', 'b'], ['c'], []]);
      const [first] = cards(blocks(el)[1].parentElement);
      expect(first.span).toEqual({ start: 1, end: 3 });
      expect(first.annotation).toBe(sidecar.annotations[0]);
    });

    it('lists the annotations that anchor nowhere with their reason', async () => {
      const el = await annotated();
      expect(el.shadowRoot?.querySelector('.unanchored summary')?.textContent).toBe('Unanchored (1)');
      expect(unanchored(el).map(({ annotation, reason }) => [annotation?.id, reason])).toEqual([['lost', 'The start anchor matches no message.']]);
    });

    it('omits the unanchored list when every annotation anchors', async () => {
      const el = await annotated({ ...sidecar, annotations: sidecar.annotations.slice(0, 3) });
      expect(el.shadowRoot?.querySelector('.unanchored')).toBeNull();
    });

    it('keeps the panel for a transcript with no messages', async () => {
      const el = await mount();
      el.transcript = { ...four, messages: [] };
      el.annotations = sidecar;
      await settle(el);
      expect(unanchored(el)).toHaveLength(4);
    });

    it('waits for a transcript before anchoring', async () => {
      const el = await mount();
      el.annotations = sidecar;
      await settle(el);
      expect(text(el, '.empty')).toBe('No transcript.');
      el.transcript = { messages: 'nope' } as unknown as Transcript;
      await settle(el);
      expect(el.shadowRoot?.querySelector('.error')).not.toBeNull();
      el.transcript = four;
      await settle(el);
      expect(inline(el)).toEqual([[], ['a', 'b'], ['c'], []]);
    });

    it('anchors again only when the transcript or the annotations change', async () => {
      const el = await annotated();
      const calls = vi.mocked(resolveAnnotations).mock.calls.length;
      el.theme = 'dark';
      await choose(el, 'label', 'honest');
      expect(vi.mocked(resolveAnnotations).mock.calls.length).toBe(calls);
      el.transcript = { ...four };
      await settle(el);
      expect(vi.mocked(resolveAnnotations).mock.calls.length).toBe(calls + 1);
    });

    it('ignores attributes named after its annotation state', async () => {
      const el = await annotated();
      el.setAttribute('sidecar', 'x');
      el.setAttribute('annotationfilter', 'x');
      await settle(el);
      expect(text(el, '.annotations-count')).toBe('Annotations (4)');
      expect(inline(el)).toEqual([[], ['a', 'b'], ['c'], []]);
    });

    it('counts the annotations', async () => {
      expect(text(await annotated(), '.annotations-count')).toBe('Annotations (4)');
    });

    it('warns when the sidecar names another transcript', async () => {
      expect((await annotated()).shadowRoot?.querySelector('.annotations-mismatch')).toBeNull();
      expect((await annotated({ ...sidecar, transcript_id: undefined })).shadowRoot?.querySelector('.annotations-mismatch')).toBeNull();
      const el = await annotated({ ...sidecar, transcript_id: 'other' });
      expect(text(el, '.annotations-mismatch')).toBe('These annotations name transcript "other", not "t1".');
    });

    describe('filtering', () => {
      it('offers every label, source, and status', async () => {
        const el = await annotated();
        const options = (name: string) => [...select(el, name).options].map(({ value, textContent }) => [value, textContent]);
        expect(options('label')).toEqual([['', 'All labels'], ['cheating', 'cheating'], ['honest', 'honest']]);
        expect(options('source')).toEqual([['', 'All sources'], ['human: kevin', 'human: kevin'], ['judge', 'judge']]);
        expect(options('status')).toEqual([['', 'All statuses'], ['unresolved', 'Unresolved'], ['confirmed', 'Confirmed'], ['rejected', 'Rejected']]);
        expect(['label', 'source', 'status'].map((name) => select(el, name).getAttribute('aria-label'))).toEqual(['Filter by label', 'Filter by source', 'Filter by status']);
      });

      it('narrows the inline cards, the unanchored list, and the count', async () => {
        const el = await annotated();
        await choose(el, 'label', 'cheating');
        expect(inline(el)).toEqual([[], ['a'], ['c'], []]);
        expect(unanchored(el)).toHaveLength(1);
        expect(text(el, '.annotations-count')).toBe('Annotations (3 of 4)');
        await choose(el, 'status', 'unresolved');
        expect(inline(el)).toEqual([[], ['a'], [], []]);
        await choose(el, 'source', 'human: kevin');
        expect(inline(el)).toEqual([[], [], [], []]);
        expect(el.shadowRoot?.querySelector('.unanchored')).toBeNull();
        expect(select(el, 'source').value).toBe('human: kevin');
      });

      it('restores everything when a filter goes back to all', async () => {
        const el = await annotated();
        await choose(el, 'label', 'honest');
        await choose(el, 'label', '');
        expect(inline(el)).toEqual([[], ['a', 'b'], ['c'], []]);
      });

      it('resets the filters when new annotations arrive', async () => {
        const el = await annotated();
        await choose(el, 'label', 'honest');
        el.annotations = { ...sidecar };
        await settle(el);
        expect(inline(el)).toEqual([[], ['a', 'b'], ['c'], []]);
        expect(select(el, 'label').value).toBe('');
        expect(select(el, 'label').selectedIndex).toBe(0);
      });
    });

    describe('resolving', () => {
      function changes(el: TeleluxTranscript) {
        const seen: AnnotationSidecar[] = [];
        document.body.addEventListener('telelux-annotations-change', (event) => seen.push((event as CustomEvent).detail.annotations));
        return { seen, el };
      }

      it('records a decision with the reviewer and time, and announces the new sidecar', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
        const { el, seen } = changes(await annotated());
        const reviewer = el.shadowRoot?.querySelector<HTMLInputElement>('input.reviewer') as HTMLInputElement;
        expect(reviewer.getAttribute('aria-label')).toBe('Reviewer');
        reviewer.value = 'kevin';
        reviewer.dispatchEvent(new Event('input'));
        resolve(cards(blocks(el)[1].parentElement)[0], { id: 'a', state: 'confirmed', note: 'clear' });
        await settle(el);
        const expected = { state: 'confirmed', by: 'kevin', note: 'clear', at: '2026-10-02T12:00:00.000Z' };
        expect(seen).toHaveLength(1);
        expect(seen[0].annotations[0].resolution).toEqual(expected);
        expect(cards(blocks(el)[1].parentElement)[0].annotation?.resolution).toEqual(expected);
        expect(el.annotations).toBe(sidecar);
        expect(sidecar.annotations[0].resolution).toBeUndefined();
      });

      it('announces the change across an enclosing shadow root', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const el = document.createElement('telelux-transcript') as TeleluxTranscript;
        host.attachShadow({ mode: 'open' }).appendChild(el);
        el.transcript = four;
        el.annotations = sidecar;
        await settle(el);
        const outer = vi.fn();
        host.addEventListener('telelux-annotations-change', outer);
        resolve(unanchored(el)[0], { id: 'lost', state: 'rejected' });
        expect(outer).toHaveBeenCalledTimes(1);
      });

      it('records a decision from the unanchored list without a reviewer', async () => {
        const { el, seen } = changes(await annotated());
        resolve(unanchored(el)[0], { id: 'lost', state: 'rejected' });
        await settle(el);
        expect(seen[0].annotations[3].resolution).toEqual({ state: 'rejected', at: expect.any(String) });
        expect(unanchored(el)[0].annotation?.resolution?.state).toBe('rejected');
      });

      it('keeps the decisions in the filter it applies', async () => {
        const el = await annotated();
        await choose(el, 'status', 'unresolved');
        resolve(cards(blocks(el)[1].parentElement)[0], { id: 'a', state: 'rejected' });
        await settle(el);
        expect(inline(el)).toEqual([[], ['b'], [], []]);
      });

      it('downloads the working sidecar under the transcript id', async () => {
        const el = await annotated();
        resolve(cards(blocks(el)[2].parentElement)[0], { id: 'c', state: undefined });
        await settle(el);
        const download = el.shadowRoot?.querySelector<HTMLButtonElement>('button.download');
        expect(download?.textContent).toBe('Download annotations');
        expect(download?.type).toBe('button');
        vi.mocked(downloadJson).mockClear();
        download?.click();
        expect(downloadJson).toHaveBeenCalledTimes(1);
        const [filename, value] = vi.mocked(downloadJson).mock.calls[0];
        expect(filename).toBe('t1.annotations.json');
        expect((value as AnnotationSidecar).annotations[2]).not.toHaveProperty('resolution');
      });
    });
  });

  describe('header', () => {
    const call = { id: 'c1', function: 'read', type: 'function' };
    const full: Transcript = {
      id: 'session-1',
      name: 'Fix the build',
      created_at: '2026-09-09T00:14:29.195Z',
      metadata: { cwd: '/repo', version: '2.1', gone: undefined },
      messages: [
        { role: 'user', content: 'go' },
        { role: 'assistant', content: 'ok', tool_calls: [call, call], metadata: { usage: { input_tokens: 1200, output_tokens: 30 } } },
        { role: 'tool', content: 'done', tool_call_id: 'c1' },
        { role: 'user', content: 'thanks' },
      ],
    };

    async function header(value: Transcript = full): Promise<TeleluxTranscript> {
      const el = await mount();
      el.transcript = value;
      await el.updateComplete;
      return el;
    }

    const $ = (el: TeleluxTranscript, selector: string) => el.shadowRoot?.querySelector<HTMLElement>(selector) ?? null;

    it('shows the label, id, name, and local creation time', async () => {
      const el = await header();
      expect($(el, '.label')?.textContent).toBe('Transcript');
      expect($(el, '.id')?.textContent).toBe('session-1');
      expect($(el, '.name')?.textContent).toBe('Fix the build');
      expect($(el, '.created-at')?.textContent).toBe(new Date('2026-09-09T00:14:29.195Z').toLocaleString());
      expect($(el, '.created-at')?.title).toBe('2026-09-09T00:14:29.195Z');
    });

    it('omits the name and creation time when they are not set', async () => {
      const el = await header({ ...full, name: null, created_at: undefined });
      expect($(el, '.name')).toBeNull();
      expect($(el, '.created-at')).toBeNull();
    });

    it('is shown above an empty message list', async () => {
      const el = await header({ ...full, messages: [] });
      expect($(el, '.id')?.textContent).toBe('session-1');
      expect($(el, '.jump')).toBeNull();
      expect($(el, '.block-nav')).toBeNull();
    });

    it('offers a before slot for a host', async () => {
      const el = await header();
      expect($(el, 'header > slot[name="before"]')).not.toBeNull();
    });

    it('does not read slotted before content as transcript text', async () => {
      const el = await mount('<span slot="before">{"crumb":1}</span>');
      expect($(el, '.empty')?.textContent).toBe('No transcript.');
    });

    it('reads the text on either side of slotted before content as one transcript', async () => {
      const el = await mount('{"a":1}\n<span slot="before">crumb</span>{"b":2}');
      expect(items(el)).toEqual(['user sniffed: {"a":1}', 'user sniffed: {"b":2}']);
    });

    it('ignores attributes named after its internal state', async () => {
      const bare = await mount();
      bare.setAttribute('slottext', '{"a":1}');
      await bare.updateComplete;
      expect($(bare, '.empty')?.textContent).toBe('No transcript.');
      const el = await header();
      el.setAttribute('metadataopen', 'x');
      el.setAttribute('copystatus', 'x');
      el.setAttribute('highlighted', '0');
      el.setAttribute('current', '2');
      await el.updateComplete;
      expect($(el, '.popover')).toBeNull();
      expect($(el, '.copy')?.textContent).toBe('Copy');
      expect(el.shadowRoot?.querySelector('li[class]')).toBeNull();
      expect(el.shadowRoot?.querySelector<TeleluxMinimap>('telelux-minimap')?.current).toBe(0);
    });

    describe('totals', () => {
      const totals = (el: TeleluxTranscript) =>
        [...(el.shadowRoot?.querySelectorAll('.totals > div') ?? [])].map((row) => `${row.className}: ${row.querySelector('dt')?.textContent} = ${row.querySelector('dd')?.textContent}`);

      it('shows role counts, tool calls, and the usage that is present', async () => {
        const el = await header();
        expect(totals(el)).toEqual([
          'roles: Messages = 2 user · 1 assistant · 1 tool',
          'tool-calls: Tool calls = 2',
          `input_tokens: Input tokens = ${(1200).toLocaleString()}`,
          'output_tokens: Output tokens = 30',
        ]);
      });

      it('shows every usage total in a fixed order', async () => {
        const usage = { cache_creation_input_tokens: 4, cache_read_input_tokens: 3, output_tokens: 2, input_tokens: 1 };
        const el = await header({ ...full, messages: [{ role: 'system', content: 's', metadata: { usage } }] });
        expect(totals(el)).toEqual([
          'roles: Messages = 1 system',
          'tool-calls: Tool calls = 0',
          'input_tokens: Input tokens = 1',
          'output_tokens: Output tokens = 2',
          'cache_read_input_tokens: Cache reads = 3',
          'cache_creation_input_tokens: Cache writes = 4',
        ]);
      });

      it('leaves usage out when no message reports it', async () => {
        const el = await header({ ...full, messages: [] });
        expect(totals(el)).toEqual(['tool-calls: Tool calls = 0']);
      });
    });

    describe('block count', () => {
      it('counts the blocks', async () => {
        const el = await header();
        expect($(el, '.count')?.textContent).toBe('4 blocks');
      });

      it('uses the singular for one block', async () => {
        const el = await header({ ...full, messages: [{ role: 'user', content: 'only' }] });
        expect($(el, '.count')?.textContent).toBe('1 block');
      });
    });

    describe('metadata', () => {
      it('labels the toggle with the count of defined keys', async () => {
        const el = await header();
        const toggle = $(el, '.metadata-toggle');
        expect(toggle?.textContent).toBe('Metadata (2)');
        expect(toggle?.getAttribute('aria-haspopup')).toBe('dialog');
        expect(toggle?.getAttribute('aria-expanded')).toBe('false');
      });

      it('has no toggle when the transcript has no metadata', async () => {
        const el = await header({ ...full, metadata: { gone: undefined } });
        expect($(el, '.metadata-toggle')).toBeNull();
      });

      it('opens a popover over the transcript metadata and closes it again', async () => {
        const el = await header();
        $(el, '.metadata-toggle')?.click();
        await el.updateComplete;
        const popover = $(el, '.popover');
        expect(popover?.getAttribute('role')).toBe('dialog');
        expect(popover?.getAttribute('aria-label')).toBe('Transcript Metadata');
        expect(popover?.querySelector('.popover-title')?.textContent).toBe('Transcript Metadata');
        expect(popover?.querySelector<TeleluxMetadata>('telelux-metadata')?.metadata).toBe(full.metadata);
        expect($(el, '.metadata-toggle')?.getAttribute('aria-expanded')).toBe('true');
        $(el, '.metadata-toggle')?.click();
        await el.updateComplete;
        expect($(el, '.popover')).toBeNull();
      });

      it('closes on Escape and returns focus to the toggle', async () => {
        const el = await header();
        $(el, '.metadata-toggle')?.click();
        await el.updateComplete;
        $(el, '.popover')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
        await el.updateComplete;
        expect($(el, '.popover')).toBeNull();
        expect(el.shadowRoot?.activeElement).toBe($(el, '.metadata-toggle'));
      });

      it('ignores Escape while closed, and other keys while open', async () => {
        const el = await header();
        const toggle = $(el, '.metadata-toggle') as HTMLElement;
        toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot?.activeElement).toBeNull();
        toggle.click();
        await el.updateComplete;
        $(el, '.popover')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await el.updateComplete;
        expect($(el, '.popover')).not.toBeNull();
      });

      it('closes when the transcript changes', async () => {
        const el = await header();
        $(el, '.metadata-toggle')?.click();
        await el.updateComplete;
        el.transcript = { ...full };
        await el.updateComplete;
        expect($(el, '.popover')).toBeNull();
      });
    });

    describe('copy button', () => {
      afterEach(() => {
        vi.useRealTimers();
        Reflect.deleteProperty(navigator, 'clipboard');
      });

      function clipboard(writeText: (text: string) => Promise<void>) {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      }

      it('puts the transcript id on the clipboard and confirms briefly', async () => {
        const writeText = vi.fn(() => Promise.resolve());
        clipboard(writeText);
        const el = await header();
        vi.useFakeTimers();
        const copy = $(el, '.copy') as HTMLElement;
        expect(copy.getAttribute('aria-label')).toBe('Copy transcript id');
        expect(copy.textContent).toBe('Copy');
        copy.click();
        await vi.advanceTimersByTimeAsync(0);
        expect(writeText).toHaveBeenCalledWith('session-1');
        expect(copy.textContent).toBe('Copied');
        await vi.advanceTimersByTimeAsync(1000);
        copy.click();
        await vi.advanceTimersByTimeAsync(1000);
        expect(copy.textContent).toBe('Copied');
        await vi.advanceTimersByTimeAsync(500);
        expect(copy.textContent).toBe('Copy');
      });

      it('says so when the clipboard is unavailable', async () => {
        const el = await header();
        ($(el, '.copy') as HTMLElement).click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await el.updateComplete;
        expect($(el, '.copy')?.textContent).toBe('Copy failed');
      });

      it('says so when the write is refused', async () => {
        clipboard(() => Promise.reject(new Error('denied')));
        const el = await header();
        ($(el, '.copy') as HTMLElement).click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await el.updateComplete;
        expect($(el, '.copy')?.textContent).toBe('Copy failed');
      });
    });

    describe('navigation', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      function stubItems(el: TeleluxTranscript, tops: number[]) {
        const scrolled: number[] = [];
        [...(el.shadowRoot?.querySelectorAll('ol > li') ?? [])].forEach((item, index) => {
          vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({ top: tops[index], bottom: tops[index] + 100 } as DOMRect);
          item.scrollIntoView = (options) => {
            expect(options).toStrictEqual({ block: 'start', behavior: 'smooth' });
            scrolled.push(index);
          };
        });
        return scrolled;
      }

      const highlighted = (el: TeleluxTranscript) =>
        [...(el.shadowRoot?.querySelectorAll('ol > li') ?? [])].flatMap((item, index) => {
          if (item.hasAttribute('class')) {
            expect(item.className).toBe('highlight');
            return [index];
          }
          return [];
        });

      async function jump(el: TeleluxTranscript, value: string) {
        const input = $(el, '.jump input') as HTMLInputElement;
        input.value = value;
        (input.form as HTMLFormElement).requestSubmit();
        await el.updateComplete;
      }

      async function press(el: TeleluxTranscript, key: string, init: KeyboardEventInit = {}, target: Element = el) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true, ...init });
        target.dispatchEvent(event);
        await el.updateComplete;
        return event;
      }

      it('makes the element focusable by click without adding a tab stop', async () => {
        const el = await header();
        expect(el.getAttribute('tabindex')).toBe('-1');
      });

      it('keeps a tabindex the page set', async () => {
        const el = document.createElement('telelux-transcript') as TeleluxTranscript;
        el.setAttribute('tabindex', '0');
        document.body.appendChild(el);
        await el.updateComplete;
        expect(el.getAttribute('tabindex')).toBe('0');
      });

      it('describes the jump input', async () => {
        const el = await header();
        const input = $(el, '.jump input') as HTMLInputElement;
        expect(input.type).toBe('number');
        expect(input.min).toBe('0');
        expect(input.max).toBe('3');
        expect(input.getAttribute('aria-label')).toBe('Jump to block');
      });

      it('jumps to a typed block and highlights it briefly', async () => {
        const el = await header();
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        vi.useFakeTimers();
        await jump(el, '2');
        expect(scrolled).toEqual([2]);
        expect(highlighted(el)).toEqual([2]);
        await vi.advanceTimersByTimeAsync(1000);
        await jump(el, '1');
        await vi.advanceTimersByTimeAsync(1000);
        expect(highlighted(el)).toEqual([1]);
        await vi.advanceTimersByTimeAsync(500);
        expect(highlighted(el)).toEqual([]);
      });

      it('ignores a typed value that is not a block number', async () => {
        const el = await header();
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        await jump(el, '');
        expect(scrolled).toEqual([]);
        expect(highlighted(el)).toEqual([]);
      });

      it('moves with J and K from the block nearest the top', async () => {
        const el = await header();
        const scrolled = stubItems(el, [-250, -50, 50, 150]);
        const event = await press(el, 'j');
        expect(event.defaultPrevented).toBe(true);
        expect(highlighted(el)).toEqual([2]);
        await press(el, 'J');
        expect(highlighted(el)).toEqual([3]);
        await press(el, 'k');
        await press(el, 'K');
        expect(scrolled).toEqual([2, 3, 2, 1]);
      });

      it('moves with the floating buttons', async () => {
        const el = await header();
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        const next = $(el, '.block-nav .next') as HTMLElement;
        const previous = $(el, '.block-nav .previous') as HTMLElement;
        expect(next.getAttribute('aria-label')).toBe('Next block');
        expect(next.getAttribute('aria-keyshortcuts')).toBe('j');
        expect(next.querySelector('kbd')?.textContent).toBe('J');
        expect(previous.getAttribute('aria-label')).toBe('Previous block');
        expect(previous.getAttribute('aria-keyshortcuts')).toBe('k');
        expect(previous.querySelector('kbd')?.textContent).toBe('K');
        next.click();
        next.click();
        previous.click();
        expect(scrolled).toEqual([1, 2, 1]);
      });

      it('handles keys pressed on a control inside a block', async () => {
        const el = await header();
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        const block = el.shadowRoot?.querySelector('telelux-message') as TeleluxMessage;
        await block.updateComplete;
        await press(el, 'j', {}, block.shadowRoot?.querySelector('button') as Element);
        expect(scrolled).toEqual([1]);
      });

      it.each([
        ['typing in the jump input', {}, true],
        ['a Ctrl chord', { ctrlKey: true }, false],
        ['a Meta chord', { metaKey: true }, false],
        ['an Alt chord', { altKey: true }, false],
      ])('ignores J during %s', async (_label, init, inInput) => {
        const el = await header();
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        const event = await press(el, 'j', init, inInput ? ($(el, '.jump input') as Element) : el);
        expect(event.defaultPrevented).toBe(false);
        expect(scrolled).toEqual([]);
      });

      it('does nothing when there are no blocks to move to', async () => {
        const el = await header({ ...full, messages: [] });
        const errors: unknown[] = [];
        const record = (event: ErrorEvent) => errors.push(event.error);
        window.addEventListener('error', record);
        await press(el, 'j');
        window.removeEventListener('error', record);
        expect(errors).toEqual([]);
      });

      it('ignores other keys', async () => {
        const el = await header();
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        const event = await press(el, 'x');
        expect(event.defaultPrevented).toBe(false);
        expect(scrolled).toEqual([]);
      });

      it('starts over when the transcript changes', async () => {
        const el = await header();
        stubItems(el, [0, 100, 200, 300]);
        await jump(el, '3');
        el.transcript = { ...full };
        await el.updateComplete;
        expect(highlighted(el)).toEqual([]);
        const scrolled = stubItems(el, [0, 100, 200, 300]);
        await press(el, 'k');
        expect(scrolled).toEqual([0]);
      });

      describe('minimap', () => {
        const minimap = (el: TeleluxTranscript) => el.shadowRoot?.querySelector<TeleluxMinimap>('telelux-minimap') ?? null;

        async function scroll(el: TeleluxTranscript, target: EventTarget = document) {
          target.dispatchEvent(new Event('scroll'));
          await el.updateComplete;
        }

        it('sits between the header and the blocks with every message', async () => {
          const el = await header();
          const map = minimap(el) as TeleluxMinimap;
          expect(map.previousElementSibling?.tagName).toBe('HEADER');
          expect(map.nextElementSibling?.tagName).toBe('OL');
          expect(map.messages).toBe(full.messages);
          expect(map.getAttribute('part')).toBe('minimap');
        });

        it('is absent without messages', async () => {
          expect(minimap(await header({ ...full, messages: [] }))).toBeNull();
        });

        it('starts on the first block', async () => {
          expect(minimap(await header())?.current).toBe(0);
        });

        it('follows the block nearest the top as the page scrolls', async () => {
          const el = await header();
          stubItems(el, [-150, -50, 50, 150]);
          await scroll(el);
          expect(minimap(el)?.current).toBe(1);
          stubItems(el, [-350, -250, -150, -50]);
          await scroll(el);
          expect(minimap(el)?.current).toBe(3);
        });

        it('follows a scrolling container around the transcript', async () => {
          const el = await header();
          const container = document.createElement('div');
          document.body.appendChild(container);
          stubItems(el, [-150, -50, 50, 150]);
          await scroll(el, container);
          expect(minimap(el)?.current).toBe(1);
        });

        it('stops following once removed from the page', async () => {
          const el = await header();
          stubItems(el, [-150, -50, 50, 150]);
          el.remove();
          await scroll(el);
          expect(minimap(el)?.current).toBe(0);
        });

        it('jumps to a clicked chip through the same path as the jump input', async () => {
          const el = await header();
          const scrolled = stubItems(el, [0, 100, 200, 300]);
          minimap(el)?.dispatchEvent(new CustomEvent('telelux-jump', { detail: { index: 2 } }));
          await el.updateComplete;
          expect(scrolled).toEqual([2]);
          expect(highlighted(el)).toEqual([2]);
          expect(minimap(el)?.current).toBe(2);
        });

        it('keeps a jumped-to block current while it stays on screen', async () => {
          const el = await header();
          stubItems(el, [0, 100, 200, 300]);
          minimap(el)?.dispatchEvent(new CustomEvent('telelux-jump', { detail: { index: 2 } }));
          await scroll(el);
          expect(minimap(el)?.current).toBe(2);
        });

        it('returns to the first block when the transcript changes', async () => {
          const el = await header();
          stubItems(el, [-150, -50, 50, 150]);
          await scroll(el);
          el.transcript = { ...full };
          await el.updateComplete;
          expect(minimap(el)?.current).toBe(0);
        });

        it('passes its theme to the minimap', async () => {
          const el = await header();
          el.theme = 'dark';
          await el.updateComplete;
          expect(minimap(el)?.getAttribute('theme')).toBe('dark');
          el.theme = undefined;
          await el.updateComplete;
          expect(minimap(el)?.hasAttribute('theme')).toBe(false);
        });
      });
    });
  });

  describe('theming', () => {
    const themed: Transcript = { ...transcript, metadata: { a: 1 } };

    it('reflects the theme property to its attribute', async () => {
      const el = await mount();
      el.theme = 'dark';
      await el.updateComplete;
      expect(el.getAttribute('theme')).toBe('dark');
      el.setAttribute('theme', 'light');
      expect(el.theme).toBe('light');
    });

    it('passes its theme to every block and to the header metadata popover', async () => {
      const el = await mount();
      el.setAttribute('theme', 'dark');
      el.transcript = themed;
      await el.updateComplete;
      el.shadowRoot?.querySelector<HTMLElement>('.metadata-toggle')?.click();
      await el.updateComplete;
      expect(blocks(el).map((block) => block.getAttribute('theme'))).toEqual(['dark', 'dark']);
      expect(el.shadowRoot?.querySelector('.popover telelux-metadata')?.getAttribute('theme')).toBe('dark');
    });

    it('leaves blocks and the popover unthemed when it has no theme', async () => {
      const el = await mount();
      el.transcript = themed;
      await el.updateComplete;
      el.shadowRoot?.querySelector<HTMLElement>('.metadata-toggle')?.click();
      await el.updateComplete;
      expect(blocks(el).map((block) => block.hasAttribute('theme'))).toEqual([false, false]);
      expect(el.shadowRoot?.querySelector('.popover telelux-metadata')?.hasAttribute('theme')).toBe(false);
    });

    it('passes its theme and the annotation part through every annotation card', async () => {
      const el = await mount();
      el.transcript = transcript;
      el.annotations = {
        version: 1,
        annotations: [
          { id: 'a', target: { start: { index: 0 } }, label: 'x', source: { kind: 'judge' } },
          { id: 'b', target: { start: { index: 7 } }, label: 'x', source: { kind: 'judge' } },
        ],
      };
      await settle(el);
      const annotationCards = [...(el.shadowRoot?.querySelectorAll('telelux-annotation') ?? [])];
      expect(annotationCards.map((card) => [card.hasAttribute('theme'), card.getAttribute('exportparts')])).toEqual([[false, 'annotation'], [false, 'annotation']]);
      el.theme = 'dark';
      await settle(el);
      expect(annotationCards.map((card) => card.getAttribute('theme'))).toEqual(['dark', 'dark']);
    });

    it('names its own regions as parts and re-exports the block parts', async () => {
      const el = await mount();
      el.transcript = themed;
      await el.updateComplete;
      expect(el.shadowRoot?.querySelector('.header')?.getAttribute('part')).toBe('transcript-header');
      expect(el.shadowRoot?.querySelector('.block-nav')?.getAttribute('part')).toBe('block-nav');
      expect(blocks(el)[0].getAttribute('exportparts')).toBe('block, block-user, block-assistant, block-system, block-tool, header, content, reasoning, tool-call');
    });
  });
});
