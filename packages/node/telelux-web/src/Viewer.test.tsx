import { act, render } from '@testing-library/react';
import type { AnnotationSidecar } from 'telelux-element/parse';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnnotationsFile, type AnnotationsFileProps } from './AnnotationsFile';
import { readSidecar } from './read-sidecar';
import { ThemeContext } from './theme-context';
import { Viewer } from './Viewer';

vi.mock('./AnnotationsFile', async () => {
  const actual = await vi.importActual<typeof import('./AnnotationsFile')>('./AnnotationsFile');
  const AnnotationsFile: typeof actual.AnnotationsFile = ({ error }) => <output className="annotations-file">{error}</output>;
  return { ...actual, AnnotationsFile: vi.fn(AnnotationsFile) };
});

vi.mock('./read-sidecar', async () => {
  const actual = await vi.importActual<typeof import('./read-sidecar')>('./read-sidecar');
  const readSidecar: typeof actual.readSidecar = (text, name) =>
    text === 'bad' ? { ok: false, error: `${name} is broken.` } : { ok: true, annotations: sidecar(text) };
  return { ...actual, readSidecar: vi.fn(readSidecar) };
});

function sidecar(id: string): AnnotationSidecar {
  return { version: 1, annotations: [{ id, target: { start: { index: 0 } }, label: 'x', source: { kind: 'human' } }] };
}

type Element = HTMLElement & { annotations?: AnnotationSidecar };

function element(container: HTMLElement): Element {
  const found = container.querySelector<Element>('telelux-transcript');
  if (!found) {
    throw new Error('no telelux-transcript');
  }
  return found;
}

async function open(result: Parameters<AnnotationsFileProps['onOpen']>[0]) {
  await act(async () => vi.mocked(AnnotationsFile).mock.lastCall?.[0].onOpen(result));
}

beforeAll(() => {
  customElements.define(
    'telelux-transcript',
    class extends HTMLElement {
      annotations: AnnotationSidecar | undefined = undefined;
    },
  );
});

beforeEach(() => {
  vi.mocked(readSidecar).mockClear();
});

describe('Viewer', () => {
  it('hands the raw transcript text to telelux-transcript as its only child', () => {
    const { container } = render(<Viewer text={'{"type":"user"}\n{"type":"assistant"}'} />);
    expect(element(container).childNodes).toHaveLength(1);
    expect(element(container).firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(element(container).textContent).toBe('{"type":"user"}\n{"type":"assistant"}');
  });

  it('puts the annotations picker above the transcript', () => {
    const { container } = render(<Viewer text="{}" />);
    expect(Array.from(container.children, (child) => child.className || child.localName)).toStrictEqual(['annotations-file', 'telelux-transcript']);
  });

  it('keeps markup in the text as text', () => {
    const { container } = render(<Viewer text={'{"content":"<b>x</b>"}'} />);
    expect(container.querySelector('b')).toBeNull();
    expect(element(container).textContent).toBe('{"content":"<b>x</b>"}');
  });

  it('forces the light scheme by default', () => {
    const { container } = render(<Viewer text="{}" />);
    expect(element(container)).toHaveAttribute('theme', 'light');
  });

  it.each([
    ['paper', 'light'],
    ['cool', 'light'],
    ['dark', 'dark'],
  ] as const)('gives telelux-transcript the %s theme\'s %s scheme', (theme, scheme) => {
    const { container } = render(
      <ThemeContext value={theme}>
        <Viewer text="{}" />
      </ThemeContext>,
    );
    expect(element(container)).toHaveAttribute('theme', scheme);
  });

  it('gives the element no annotations until some are loaded', () => {
    const { container } = render(<Viewer text="{}" />);
    expect(element(container).annotations).toBeUndefined();
    expect(element(container).hasAttribute('annotations')).toBe(false);
    expect(readSidecar).not.toHaveBeenCalled();
    expect(container.querySelector('.annotations-file')).toBeEmptyDOMElement();
  });

  it('sets the baked-in annotations as the element\'s annotations property', () => {
    const { container } = render(<Viewer text="{}" annotations="baked" />);
    expect(readSidecar).toHaveBeenCalledWith('baked', 'The baked-in annotations slot');
    expect(element(container).annotations).toStrictEqual(sidecar('baked'));
  });

  it('reports baked-in annotations it cannot read, and renders the transcript without them', () => {
    const { container } = render(<Viewer text="{}" annotations="bad" />);
    expect(container.querySelector('.annotations-file')).toHaveTextContent('The baked-in annotations slot is broken.');
    expect(element(container).annotations).toBeUndefined();
  });

  it('keeps handing the element the same sidecar object when it re-renders', () => {
    const { container, rerender } = render(<Viewer text="{}" annotations="baked" />);
    const first = element(container).annotations;
    rerender(<Viewer text="{}" annotations="baked" />);
    expect(element(container).annotations).toBe(first);
    expect(readSidecar).toHaveBeenCalledTimes(1);
    rerender(<Viewer text="{}" annotations="other" />);
    expect(element(container).annotations).toStrictEqual(sidecar('other'));
  });

  it('replaces the annotations with a picked file\'s, and clears an earlier error', async () => {
    const { container } = render(<Viewer text="{}" annotations="bad" />);
    await open({ kind: 'annotations', annotations: sidecar('picked') });
    expect(element(container).annotations).toStrictEqual(sidecar('picked'));
    expect(container.querySelector('.annotations-file')).toBeEmptyDOMElement();
  });

  it('keeps the current annotations and shows why a picked file was refused', async () => {
    const { container } = render(<Viewer text="{}" annotations="baked" />);
    await open({ kind: 'error', message: 'a.json is not valid JSON.' });
    expect(container.querySelector('.annotations-file')).toHaveTextContent('a.json is not valid JSON.');
    expect(element(container).annotations).toStrictEqual(sidecar('baked'));
  });

  it('ignores an empty selection', async () => {
    const { container } = render(<Viewer text="{}" annotations="bad" />);
    await open({ kind: 'none' });
    expect(container.querySelector('.annotations-file')).toHaveTextContent('The baked-in annotations slot is broken.');
  });

  it('drops picked annotations and their errors when another transcript is shown', async () => {
    const { container, rerender } = render(<Viewer text="first" />);
    await open({ kind: 'annotations', annotations: sidecar('picked') });
    rerender(<Viewer text="second" />);
    expect(element(container).annotations).toBeUndefined();
    await open({ kind: 'error', message: 'Nope.' });
    rerender(<Viewer text="third" />);
    expect(container.querySelector('.annotations-file')).toBeEmptyDOMElement();
  });
});
