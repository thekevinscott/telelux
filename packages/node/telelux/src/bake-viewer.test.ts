import { describe, expect, it } from 'vitest';
import { bakeViewer } from './bake-viewer';

describe('bakeViewer', () => {
  it('embeds the transcript and annotations in their slots', () => {
    const html = bakeViewer('hello & <world>', '{"note":"ok"}');
    expect(html).toContain('hello &amp; &lt;world&gt;');
    expect(html).toContain('{"note":"ok"}');
    expect(bakeViewer('hello', null)).toContain('<script type="application/json" id="annotations"></script>');
  });
});
