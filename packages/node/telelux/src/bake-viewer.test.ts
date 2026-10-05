import { describe, expect, it, vi } from 'vitest';
import { bakeViewer } from './bake-viewer';
import { readViewer } from './read-viewer';

vi.mock('./read-viewer', async () => {
  const actual = await vi.importActual<typeof import('./read-viewer')>('./read-viewer');
  const readViewer: typeof actual.readViewer = () => '<script type="application/x-ndjson" id="transcript"></script><script type="application/json" id="annotations"></script>';
  return { ...actual, readViewer: vi.fn(readViewer) };
});

describe('bakeViewer', () => {
  it('embeds the transcript and annotations in their slots', () => {
    const html = bakeViewer('hello & <world>', '{"note":"ok"}');
    expect(html).toContain('hello &amp; &lt;world&gt;');
    expect(html).toContain('{"note":"ok"}');
    expect(bakeViewer('hello', null)).toContain('<script type="application/json" id="annotations"></script>');
  });
  it('names the missing slot', () => {
    vi.mocked(readViewer).mockReturnValueOnce('');
    expect(() => bakeViewer('hello', null)).toThrow('0 transcript slots');
    vi.mocked(readViewer).mockReturnValueOnce('<script type="application/x-ndjson" id="transcript"></script>');
    expect(() => bakeViewer('hello', null)).toThrow('0 annotations slots');
  });
});
