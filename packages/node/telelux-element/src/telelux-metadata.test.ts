import { afterEach, describe, expect, it } from 'vitest';

import { TeleluxMetadata } from './telelux-metadata';
import type { Metadata } from './transcript';

async function mount(metadata: Metadata | undefined): Promise<TeleluxMetadata> {
  const el = document.createElement('telelux-metadata') as TeleluxMetadata;
  el.metadata = metadata;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function pairs(root: Element | null | undefined): [string, string][] {
  const terms = [...(root?.children ?? [])].filter((child) => child.tagName === 'DT');
  return terms.map((dt) => [dt.textContent ?? '', dt.nextElementSibling?.textContent ?? '']);
}

describe('TeleluxMetadata', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-metadata tag', () => {
    expect(customElements.get('telelux-metadata')).toBe(TeleluxMetadata);
  });

  it('renders the empty state for missing or empty metadata', async () => {
    expect((await mount(undefined)).shadowRoot?.querySelector('.empty')?.textContent).toBe('No metadata.');
    expect((await mount({ gone: undefined })).shadowRoot?.querySelector('dl')).toBeNull();
  });

  it('renders primitives as key/value pairs', async () => {
    const el = await mount({ type: 'assistant', count: 3, ok: false });
    expect(pairs(el.shadowRoot?.querySelector('dl'))).toEqual([['type', 'assistant'], ['count', '3'], ['ok', 'false']]);
  });

  it('renders an array as a list', async () => {
    const el = await mount({ tags: ['a', 2, true] });
    const items = [...(el.shadowRoot?.querySelectorAll('dd li') ?? [])].map((li) => li.textContent);
    expect(items).toEqual(['a', '2', 'true']);
  });

  it('renders a nested object one level deep, with its arrays as JSON', async () => {
    const el = await mount({ usage: { input_tokens: 10, models: ['x', 'y'] } });
    const nested = el.shadowRoot?.querySelector('dd > dl');
    expect(pairs(nested)).toEqual([['input_tokens', '10'], ['models', '["x","y"]']]);
  });

  it('renders keys and values as text, never as markup', async () => {
    const el = await mount({ '<i>k</i>': '<b>v</b>' });
    expect(el.shadowRoot?.querySelector('b, i')).toBeNull();
    expect(pairs(el.shadowRoot?.querySelector('dl'))).toEqual([['<i>k</i>', '<b>v</b>']]);
  });

  it('re-renders when the metadata changes', async () => {
    const el = await mount({ a: 1 });
    el.metadata = { b: 2 };
    await el.updateComplete;
    expect(pairs(el.shadowRoot?.querySelector('dl'))).toEqual([['b', '2']]);
  });

  it('ignores a metadata attribute', async () => {
    const el = await mount({ a: 1 });
    el.setAttribute('metadata', '{"b":2}');
    await el.updateComplete;
    expect(el.metadata).toEqual({ a: 1 });
  });
});
