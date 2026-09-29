import { afterEach, describe, expect, it } from 'vitest';

import { TeleluxMinimap } from './telelux-minimap';
import type { ChatMessage } from './transcript';

const messages: ChatMessage[] = [
  { role: 'system', content: 'rules' },
  { role: 'user', content: 'hi' },
  { role: 'assistant', content: 'hello' },
  { role: 'tool', content: 'ok' },
  { role: 'tool', content: 'boom', error: { type: 'x', message: 'failed' } },
];

async function mount(list: ChatMessage[] = messages, current?: number): Promise<TeleluxMinimap> {
  const el = document.createElement('telelux-minimap') as TeleluxMinimap;
  el.messages = list;
  el.current = current;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const chips = (el: TeleluxMinimap) => [...(el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.strip > button') ?? [])];

async function press(el: TeleluxMinimap, chip: HTMLButtonElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
  chip.dispatchEvent(event);
  await el.updateComplete;
  await el.updateComplete;
  return event;
}

const roving = (el: TeleluxMinimap) => chips(el).map((chip) => chip.getAttribute('tabindex'));

describe('TeleluxMinimap', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-minimap tag', () => {
    expect(customElements.get('telelux-minimap')).toBe(TeleluxMinimap);
  });

  it('counts the messages in its heading', async () => {
    expect((await mount()).shadowRoot?.querySelector('.title')?.textContent).toBe('Minimap (5 messages)');
    expect((await mount([messages[1]])).shadowRoot?.querySelector('.title')?.textContent).toBe('Minimap (1 message)');
    const empty = document.createElement('telelux-minimap') as TeleluxMinimap;
    document.body.appendChild(empty);
    await empty.updateComplete;
    expect(empty.shadowRoot?.querySelector('.title')?.textContent).toBe('Minimap (0 messages)');
    expect(chips(empty)).toEqual([]);
  });

  it('shows a legend for each role and for errors', async () => {
    const el = await mount();
    const items = [...(el.shadowRoot?.querySelectorAll('.legend li') ?? [])];
    expect(items.map((item) => [item.firstElementChild?.className, item.textContent])).toEqual([
      ['dot system', 'System'],
      ['dot user', 'User'],
      ['dot assistant', 'Assistant'],
      ['dot tool', 'Tool'],
      ['triangle', 'Error'],
    ]);
  });

  it('draws one chip per message in order, classed by role', async () => {
    const el = await mount();
    expect(chips(el).map((chip) => chip.className)).toEqual(['chip system', 'chip user', 'chip assistant', 'chip tool', 'chip tool']);
    expect(chips(el).every((chip) => chip.type === 'button')).toBe(true);
  });

  it('labels each chip with its block number and role', async () => {
    const el = await mount();
    expect(chips(el).map((chip) => chip.title)).toEqual(['Block 0 system', 'Block 1 user', 'Block 2 assistant', 'Block 3 tool', 'Block 4 tool error']);
    expect(chips(el).map((chip) => chip.getAttribute('aria-label'))).toEqual(chips(el).map((chip) => chip.title));
  });

  it('overlays the error triangle only on tool messages with an error', async () => {
    const el = await mount([...messages, { role: 'user', content: 'x', metadata: { error: 'no' } }]);
    expect(chips(el).map((chip) => chip.querySelector('.triangle') !== null)).toEqual([false, false, false, false, true, false]);
  });

  it('is a labelled toolbar', async () => {
    const strip = (await mount()).shadowRoot?.querySelector('.strip');
    expect(strip?.getAttribute('role')).toBe('toolbar');
    expect(strip?.getAttribute('aria-label')).toBe('Minimap');
  });

  describe('current chip', () => {
    it('marks only the current chip', async () => {
      const el = await mount(messages, 2);
      expect(chips(el).map((chip) => chip.getAttribute('aria-current'))).toEqual([null, null, 'true', null, null]);
    });

    it('marks nothing without a current block', async () => {
      const el = await mount();
      expect(chips(el).some((chip) => chip.hasAttribute('aria-current'))).toBe(false);
    });

    it('follows the current property', async () => {
      const el = await mount(messages, 0);
      el.current = 3;
      await el.updateComplete;
      expect(chips(el).map((chip) => chip.hasAttribute('aria-current'))).toEqual([false, false, false, true, false]);
    });

    it('scrolls the strip to keep the current chip in view', async () => {
      const el = await mount();
      const strip = el.shadowRoot?.querySelector('.strip') as HTMLElement;
      Object.defineProperty(strip, 'clientWidth', { value: 100 });
      chips(el).forEach((chip, index) => {
        Object.defineProperty(chip, 'offsetLeft', { value: index * 60 });
        Object.defineProperty(chip, 'offsetWidth', { value: 10 });
      });
      el.current = 4;
      await el.updateComplete;
      expect(strip.scrollLeft).toBe(150);
      el.current = 1;
      await el.updateComplete;
      expect(strip.scrollLeft).toBe(60);
    });

    it('leaves the strip alone when something other than the current block changes', async () => {
      const el = await mount(messages, 4);
      const strip = el.shadowRoot?.querySelector('.strip') as HTMLElement;
      Object.defineProperty(strip, 'clientWidth', { value: 100 });
      Object.defineProperty(chips(el)[4], 'offsetLeft', { value: 240 });
      el.theme = 'dark';
      await el.updateComplete;
      expect(strip.scrollLeft).toBe(0);
    });

    it('ignores a current index past the last chip', async () => {
      const el = await mount(messages, 9);
      expect(chips(el).some((chip) => chip.hasAttribute('aria-current'))).toBe(false);
    });
  });

  describe('jumping', () => {
    it('dispatches telelux-jump with the clicked block index', async () => {
      const el = await mount();
      const jumps: number[] = [];
      el.addEventListener('telelux-jump', (event) => jumps.push((event as CustomEvent<{ index: number }>).detail.index));
      chips(el)[3].click();
      chips(el)[1].click();
      expect(jumps).toEqual([3, 1]);
    });

    it('moves the tab stop to the clicked chip', async () => {
      const el = await mount(messages, 0);
      chips(el)[3].click();
      await el.updateComplete;
      expect(roving(el)).toEqual(['-1', '-1', '-1', '0', '-1']);
    });
  });

  describe('keyboard', () => {
    it('puts the single tab stop on the current chip, or the first', async () => {
      expect(roving(await mount())).toEqual(['0', '-1', '-1', '-1', '-1']);
      expect(roving(await mount(messages, 2))).toEqual(['-1', '-1', '0', '-1', '-1']);
    });

    it('moves focus and the tab stop with the arrow keys, clamped at the ends', async () => {
      const el = await mount(messages, 1);
      const moves: [string, number][] = [['ArrowRight', 2], ['ArrowRight', 3], ['ArrowLeft', 2], ['End', 4], ['ArrowRight', 4], ['Home', 0], ['ArrowLeft', 0]];
      for (const [key, expected] of moves) {
        const event = await press(el, el.shadowRoot?.activeElement as HTMLButtonElement ?? chips(el)[1], key);
        expect(event.defaultPrevented).toBe(true);
        expect(el.shadowRoot?.activeElement).toBe(chips(el)[expected]);
        expect(roving(el).indexOf('0')).toBe(expected);
      }
    });

    it('leaves other keys to the page', async () => {
      const el = await mount(messages, 1);
      const event = await press(el, chips(el)[1], 'j');
      expect(event.defaultPrevented).toBe(false);
      expect(roving(el).indexOf('0')).toBe(1);
    });

    it('forgets the tab stop when the messages change', async () => {
      const el = await mount(messages, 0);
      chips(el)[3].click();
      el.messages = [...messages];
      await el.updateComplete;
      expect(roving(el).indexOf('0')).toBe(0);
    });
  });

  describe('theming', () => {
    it('reflects the theme property to its attribute', async () => {
      const el = await mount();
      el.theme = 'dark';
      await el.updateComplete;
      expect(el.getAttribute('theme')).toBe('dark');
      el.setAttribute('theme', 'light');
      expect(el.theme).toBe('light');
    });
  });

  it('ignores messages and current attributes', async () => {
    const el = await mount(messages, 1);
    el.setAttribute('messages', '[]');
    el.setAttribute('current', '3');
    el.setAttribute('active', '2');
    await el.updateComplete;
    expect(chips(el)).toHaveLength(5);
    expect(roving(el).indexOf('0')).toBe(1);
  });
});
