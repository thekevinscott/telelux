import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Annotation, AnnotationSidecar } from './annotations';
import { resolveAnnotations } from './resolve-annotations';
import { TeleluxTimeline } from './telelux-timeline';
import type { ChatMessage } from './transcript';

vi.mock('./resolve-annotations', async () => {
  const actual = await vi.importActual<typeof import('./resolve-annotations')>('./resolve-annotations');
  return { ...actual, resolveAnnotations: vi.fn(actual.resolveAnnotations) };
});

vi.mock('./annotation-labels', async () => {
  const actual = await vi.importActual<typeof import('./annotation-labels')>('./annotation-labels');
  return { ...actual, annotationStatus: vi.fn(actual.annotationStatus) };
});

vi.mock('./tick-step', async () => {
  const actual = await vi.importActual<typeof import('./tick-step')>('./tick-step');
  return { ...actual, tickStep: vi.fn(actual.tickStep) };
});

vi.mock('./timeline-lanes', async () => {
  const actual = await vi.importActual<typeof import('./timeline-lanes')>('./timeline-lanes');
  return { ...actual, timelineLanes: vi.fn(actual.timelineLanes) };
});

const messages: ChatMessage[] = Array.from({ length: 20 }, (_, index) => ({ role: 'user', content: `m${index}` }));

const event = (id: string, start: number, end: number | undefined, extra: Partial<Annotation> = {}): Annotation => ({
  id,
  target: { start: { index: start }, ...(end === undefined ? {} : { end: { index: end } }) },
  label: id,
  source: { kind: 'judge' },
  ...extra,
});

const sidecar: AnnotationSidecar = {
  version: 1,
  annotations: [
    event('edit', 5, 9, { summary: 'Edits the test file', resolution: { state: 'confirmed' } }),
    event('read', 0, undefined),
    event('overlap', 8, 15),
    event('lost', 40, undefined),
  ],
};

async function mount(annotations: unknown = sidecar, withMessages = true): Promise<TeleluxTimeline> {
  const el = document.createElement('telelux-timeline') as TeleluxTimeline;
  if (withMessages) {
    el.messages = messages;
  }
  el.annotations = annotations as AnnotationSidecar;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const $ = (el: TeleluxTimeline, selector: string) => el.shadowRoot?.querySelector<HTMLElement>(selector) ?? null;
const bars = (el: TeleluxTimeline) => [...(el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.event') ?? [])];
const track = (el: TeleluxTimeline) => $(el, '.track') as HTMLElement;

async function zoom(el: TeleluxTimeline, direction: 'in' | 'out', times = 1) {
  for (let step = 0; step < times; step += 1) {
    $(el, `.zoom-${direction}`)?.click();
    await el.updateComplete;
  }
}

describe('TeleluxTimeline', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-timeline tag', () => {
    expect(customElements.get('telelux-timeline')).toBe(TeleluxTimeline);
  });

  it('reflects the theme property to its attribute', async () => {
    const el = await mount();
    el.theme = 'dark';
    await el.updateComplete;
    expect(el.getAttribute('theme')).toBe('dark');
    el.setAttribute('theme', 'light');
    expect(el.theme).toBe('light');
  });

  it('ignores attributes named after its properties and state', async () => {
    const el = await mount();
    for (const name of ['messages', 'annotations', 'zoom', 'sidecar', 'error']) {
      el.setAttribute(name, '3');
    }
    await el.updateComplete;
    expect(el.messages).toBe(messages);
    expect(el.annotations).toBe(sidecar);
    expect($(el, '.zoom-level')?.textContent).toBe('1×');
    expect(bars(el)).toHaveLength(3);
  });

  it('renders nothing without annotations', async () => {
    const el = await mount(null);
    expect($(el, '.timeline')).toBeNull();
    expect($(el, '.error')).toBeNull();
    el.annotations = undefined;
    await el.updateComplete;
    expect($(el, '.timeline')).toBeNull();
    expect($(el, '.error')).toBeNull();
  });

  it('shows why the annotations are invalid', async () => {
    const error = $(await mount({ version: 3, annotations: [] }), '.error');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toMatch(/^Invalid annotations:\n✖ /);
  });

  it('labels the region and counts the placed events', async () => {
    const el = await mount();
    expect($(el, '.timeline')?.getAttribute('part')).toBe('timeline');
    expect($(el, '.timeline')?.getAttribute('aria-label')).toBe('Timeline');
    expect($(el, '.title')?.textContent).toBe('Timeline (3 events)');
    expect($(await mount({ version: 1, annotations: [event('one', 1, undefined)] }), '.title')?.textContent).toBe('Timeline (1 event)');
  });

  describe('events', () => {
    it('places each event across the blocks it spans', async () => {
      const el = await mount();
      expect(bars(el).map((bar) => bar.getAttribute('style'))).toEqual([
        'left: 25%; width: 25%; top: 0px;',
        'left: 0%; width: 5%; top: 0px;',
        'left: 40%; width: 40%; top: 24px;',
      ]);
    });

    it('stacks overlapping events and sizes the track to fit them', async () => {
      const el = await mount();
      expect(track(el).style.height).toBe('48px');
      const single = await mount({ version: 1, annotations: [event('one', 1, undefined)] });
      expect(track(single).style.height).toBe('24px');
    });

    it('names each event by its summary or label and its blocks', async () => {
      const el = await mount();
      expect(bars(el).map((bar) => [bar.textContent, bar.getAttribute('aria-label'), bar.title, bar.type])).toEqual([
        ['Edits the test file', 'Edits the test file, blocks 5–9', 'edit: Edits the test file (blocks 5–9)', 'button'],
        ['read', 'read, block 0', 'read (block 0)', 'button'],
        ['overlap', 'overlap, blocks 8–15', 'overlap (blocks 8–15)', 'button'],
      ]);
    });

    it('marks each event with its status', async () => {
      const el = await mount();
      expect(bars(el).map((bar) => bar.dataset.status)).toEqual(['confirmed', 'unresolved', 'unresolved']);
    });

    it('fires telelux-jump with the span when an event is clicked', async () => {
      const el = await mount();
      const jumps: unknown[] = [];
      el.addEventListener('telelux-jump', (jump) => jumps.push((jump as CustomEvent).detail));
      bars(el)[0].click();
      bars(el)[1].click();
      expect(jumps).toEqual([
        { index: 5, end: 9 },
        { index: 0, end: 0 },
      ]);
    });

    it('lists the events it could not place, with the reason', async () => {
      const el = await mount();
      expect($(el, '.unplaced summary')?.textContent).toBe('Not placed (1)');
      expect([...(el.shadowRoot?.querySelectorAll('.unplaced li') ?? [])].map((item) => item.textContent)).toEqual(['lost: The start anchor matches no message.']);
      expect($(await mount({ version: 1, annotations: [event('one', 1, undefined)] }), '.unplaced')).toBeNull();
    });

    it('places nothing when there are no messages', async () => {
      const el = await mount(sidecar, false);
      expect(bars(el)).toEqual([]);
      expect($(el, '.unplaced summary')?.textContent).toBe('Not placed (4)');
      expect($(el, '.ticks')?.children).toHaveLength(0);
    });

    it('re-resolves only when the messages or annotations change', async () => {
      const el = await mount();
      const calls = vi.mocked(resolveAnnotations).mock.calls.length;
      await zoom(el, 'in');
      el.theme = 'dark';
      await el.updateComplete;
      expect(vi.mocked(resolveAnnotations).mock.calls.length).toBe(calls);
      el.messages = [...messages];
      await el.updateComplete;
      el.annotations = { ...sidecar };
      await el.updateComplete;
      expect(vi.mocked(resolveAnnotations).mock.calls.length).toBe(calls + 2);
    });
  });

  describe('axis', () => {
    it('ticks block numbers across the track', async () => {
      const el = await mount();
      const ticks = [...(el.shadowRoot?.querySelectorAll<HTMLElement>('.tick') ?? [])];
      expect(ticks.map((tick) => tick.textContent)).toEqual(['0', '5', '10', '15']);
      expect(ticks.map((tick) => tick.getAttribute('style'))).toEqual(['left: 0%;', 'left: 25%;', 'left: 50%;', 'left: 75%;']);
    });

    it('starts at 1× with zoom out disabled', async () => {
      const el = await mount();
      expect($(el, '.zoom-level')?.textContent).toBe('1×');
      expect(track(el).style.width).toBe('100%');
      expect(($(el, '.zoom-out') as HTMLButtonElement).disabled).toBe(true);
      expect(($(el, '.zoom-in') as HTMLButtonElement).disabled).toBe(false);
      expect([$(el, '.zoom-in')?.getAttribute('aria-label'), $(el, '.zoom-out')?.getAttribute('aria-label')]).toEqual(['Zoom in', 'Zoom out']);
      expect([($(el, '.zoom-in') as HTMLButtonElement).type, ($(el, '.zoom-out') as HTMLButtonElement).type]).toEqual(['button', 'button']);
    });

    it('doubles the track and ticks more finely on zoom in, up to 16×', async () => {
      const el = await mount();
      await zoom(el, 'in');
      expect($(el, '.zoom-level')?.textContent).toBe('2×');
      expect(track(el).style.width).toBe('200%');
      expect(el.shadowRoot?.querySelectorAll('.tick')).toHaveLength(10);
      await zoom(el, 'in', 5);
      expect($(el, '.zoom-level')?.textContent).toBe('16×');
      expect(track(el).style.width).toBe('1600%');
      expect(($(el, '.zoom-in') as HTMLButtonElement).disabled).toBe(true);
      expect(($(el, '.zoom-out') as HTMLButtonElement).disabled).toBe(false);
    });

    it('zooms back out to 1×', async () => {
      const el = await mount();
      await zoom(el, 'in', 2);
      await zoom(el, 'out');
      expect($(el, '.zoom-level')?.textContent).toBe('2×');
      await zoom(el, 'out', 3);
      expect($(el, '.zoom-level')?.textContent).toBe('1×');
    });

    it('scrolls the axis with the scroller, not the page', async () => {
      const el = await mount();
      expect($(el, '.scroller')?.contains(track(el))).toBe(true);
    });
  });
});
