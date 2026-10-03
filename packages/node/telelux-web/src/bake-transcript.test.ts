import { describe, expect, it } from 'vitest';

import { bakeTranscript } from './bake-transcript';

const page = [
  '<!doctype html>',
  '<html lang="en"><head><title>Telelux</title><script type="module">const tag = "<\\/script>";</script></head>',
  '<body><div id="root"></div><script type="application/x-ndjson" id="transcript"></script></body></html>',
].join('\n');

function slotOf(html: string): string {
  return /<script type="application\/x-ndjson" id="transcript">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
}

describe('bakeTranscript', () => {
  it('puts the transcript text into the empty slot and keeps the rest of the page', () => {
    const html = bakeTranscript(page, '{"type":"user"}\n{"type":"assistant"}');
    expect(html.startsWith('<!doctype html>\n<html lang="en">')).toBe(true);
    expect(slotOf(html)).toBe('{"type":"user"}\n{"type":"assistant"}');
    expect(html).toContain('<title>Telelux</title>');
    expect(html).toContain('<script type="module">const tag = "<\\/script>";</script>');
    expect(html).toContain('<div id="root"></div>');
  });

  it('escapes &, < and > as &amp;, &lt; and &gt; so no text can close the slot or open a comment', () => {
    const html = bakeTranscript(page, '{"x":"</script><script>alert(1)</script> <!-- & &lt; >"}');
    expect(slotOf(html)).toBe('{"x":"&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt; &lt;!-- &amp; &amp;lt; &gt;"}');
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    expect(parsed.querySelectorAll('script')).toHaveLength(2);
    expect(parsed.getElementById('transcript')?.textContent).toBe(slotOf(html));
  });

  it('replaces whatever an already baked page holds', () => {
    const baked = bakeTranscript(page, 'first');
    expect(slotOf(bakeTranscript(baked, 'second'))).toBe('second');
  });

  it('empties the app root so the download starts from a clean mount point', () => {
    const rendered = page.replace('<div id="root"></div>', '<div id="root"><p>Rendered</p></div>');
    expect(bakeTranscript(rendered, 'x')).toContain('<div id="root"></div>');
  });

  it('empties the annotations slot, whose annotations belong to the transcript being replaced', () => {
    const annotated = page.replace('</body>', '<script type="application/json" id="annotations">{"version":1}</script></body>');
    expect(bakeTranscript(annotated, 'x')).toContain('<script type="application/json" id="annotations"></script>');
  });

  it('refuses a page with no transcript slot', () => {
    expect(() => bakeTranscript('<!doctype html><div id="root"></div>', 'x')).toThrow('The page has no transcript slot to bake into.');
  });

  it('bakes a page with no app root', () => {
    expect(bakeTranscript('<script type="application/x-ndjson" id="transcript"></script>', 'x')).toContain('id="transcript">x</script>');
  });
});
