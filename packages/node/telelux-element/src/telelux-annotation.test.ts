import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Annotation } from './annotations';
import { TeleluxAnnotation } from './telelux-annotation';

vi.mock('./annotation-labels', async () => {
  const actual = await vi.importActual<typeof import('./annotation-labels')>('./annotation-labels');
  return { ...actual, sourceName: vi.fn(actual.sourceName), annotationStatus: vi.fn(actual.annotationStatus) };
});

const annotation: Annotation = {
  id: 'a1',
  target: { start: { index: 2 } },
  label: 'test-tampering',
  source: { kind: 'judge', name: 'rubric-v2' },
};

async function mount(props: Partial<Pick<TeleluxAnnotation, 'annotation' | 'span' | 'reason'>> = {}): Promise<TeleluxAnnotation> {
  const el = document.createElement('telelux-annotation') as TeleluxAnnotation;
  el.annotation = annotation;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const text = (el: TeleluxAnnotation, selector: string) => el.shadowRoot?.querySelector(selector)?.textContent?.trim();
const button = (el: TeleluxAnnotation, selector: string) => el.shadowRoot?.querySelector<HTMLButtonElement>(selector) ?? undefined;

function resolves(el: TeleluxAnnotation) {
  const details: unknown[] = [];
  el.addEventListener('telelux-resolve', (event) => details.push((event as CustomEvent).detail));
  return details;
}

describe('TeleluxAnnotation', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-annotation tag', () => {
    expect(customElements.get('telelux-annotation')).toBe(TeleluxAnnotation);
  });

  it('reflects the theme property to its attribute', async () => {
    const el = await mount();
    el.theme = 'dark';
    await el.updateComplete;
    expect(el.getAttribute('theme')).toBe('dark');
    el.setAttribute('theme', 'light');
    expect(el.theme).toBe('light');
  });

  it('ignores annotation, span, and reason attributes', async () => {
    const el = await mount();
    el.setAttribute('annotation', '{}');
    el.setAttribute('span', '{}');
    el.setAttribute('reason', 'x');
    await el.updateComplete;
    expect(el.annotation).toBe(annotation);
    expect(el.span).toBeUndefined();
    expect(el.reason).toBeUndefined();
  });

  it('renders nothing without an annotation', async () => {
    const el = document.createElement('telelux-annotation') as TeleluxAnnotation;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('article')).toBeNull();
  });

  it('shows the label, source, and status of a minimal annotation', async () => {
    const el = await mount();
    const article = el.shadowRoot?.querySelector('article');
    expect(article?.getAttribute('part')).toBe('annotation');
    expect(article?.dataset.status).toBe('unresolved');
    expect(article?.getAttribute('aria-label')).toBe('Annotation test-tampering');
    expect(text(el, '.label')).toBe('test-tampering');
    expect(text(el, '.source')).toBe('judge: rubric-v2');
    expect(text(el, '.status')).toBe('Unresolved');
    for (const selector of ['.confidence', '.span', '.summary', '.note', '.reason', '.resolution-note']) {
      expect(el.shadowRoot?.querySelector(selector)).toBeNull();
    }
  });

  it('shows confidence as a whole percentage', async () => {
    expect(text(await mount({ annotation: { ...annotation, confidence: 0.756 } }), '.confidence')).toBe('76%');
    expect(text(await mount({ annotation: { ...annotation, confidence: 0 } }), '.confidence')).toBe('0%');
  });

  it('shows the summary and note', async () => {
    const el = await mount({ annotation: { ...annotation, summary: 'Edits the test file', note: 'Line 40 deletes an assertion.' } });
    expect(text(el, '.summary')).toBe('Edits the test file');
    expect(text(el, '.note')).toBe('Line 40 deletes an assertion.');
  });

  it('shows a span only when it covers more than one block', async () => {
    expect(text(await mount({ span: { start: 2, end: 5 } }), '.span')).toBe('Blocks 2–5');
    expect((await mount({ span: { start: 2, end: 2 } })).shadowRoot?.querySelector('.span')).toBeNull();
  });

  it('shows why an annotation is unanchored', async () => {
    expect(text(await mount({ reason: 'The start anchor matches no message.' }), '.reason')).toBe('The start anchor matches no message.');
  });

  it('shows who resolved it and their note', async () => {
    const el = await mount({ annotation: { ...annotation, resolution: { state: 'confirmed', by: 'kevin', note: 'Agreed.' } } });
    expect(el.shadowRoot?.querySelector('article')?.dataset.status).toBe('confirmed');
    expect(text(el, '.status')).toBe('Confirmed by kevin');
    expect(text(el, '.resolution-note')).toBe('Agreed.');
    const anonymous = await mount({ annotation: { ...annotation, resolution: { state: 'rejected' } } });
    expect(text(anonymous, '.status')).toBe('Rejected');
  });

  describe('resolving', () => {
    it('offers a note and Confirm and Reject while unresolved', async () => {
      const el = await mount();
      expect(el.shadowRoot?.querySelector('textarea')?.getAttribute('aria-label')).toBe('Review note');
      expect(button(el, '.confirm')?.textContent).toBe('Confirm');
      expect(button(el, '.reject')?.textContent).toBe('Reject');
      expect(button(el, '.reopen')).toBeUndefined();
      expect([button(el, '.confirm')?.type, button(el, '.reject')?.type]).toEqual(['button', 'button']);
    });

    it('fires telelux-resolve with the state and the note', async () => {
      const el = await mount();
      const details = resolves(el);
      (el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement).value = 'looks right';
      button(el, '.confirm')?.click();
      button(el, '.reject')?.click();
      expect(details).toEqual([
        { id: 'a1', state: 'confirmed', note: 'looks right' },
        { id: 'a1', state: 'rejected', note: 'looks right' },
      ]);
    });

    it('fires an event that bubbles out of the shadow root', async () => {
      const el = await mount();
      const outer = vi.fn();
      document.body.addEventListener('telelux-resolve', outer);
      button(el, '.confirm')?.click();
      document.body.removeEventListener('telelux-resolve', outer);
      expect(outer).toHaveBeenCalledTimes(1);
    });

    it('fires an event that crosses an enclosing shadow root', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const el = document.createElement('telelux-annotation') as TeleluxAnnotation;
      el.annotation = annotation;
      host.attachShadow({ mode: 'open' }).appendChild(el);
      await el.updateComplete;
      const outer = vi.fn();
      host.addEventListener('telelux-resolve', outer);
      button(el, '.confirm')?.click();
      expect(outer).toHaveBeenCalledTimes(1);
    });

    it('offers Reopen once resolved, which clears the state', async () => {
      const el = await mount({ annotation: { ...annotation, resolution: { state: 'rejected' } } });
      expect(el.shadowRoot?.querySelector('textarea')).toBeNull();
      expect(button(el, '.confirm')).toBeUndefined();
      expect(button(el, '.reopen')?.type).toBe('button');
      const details = resolves(el);
      button(el, '.reopen')?.click();
      expect(details).toEqual([{ id: 'a1', state: undefined, note: undefined }]);
    });
  });
});
