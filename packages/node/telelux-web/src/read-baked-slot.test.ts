import { afterEach, describe, expect, it } from 'vitest';

import { readBakedSlot } from './read-baked-slot';

function slot(text: string, id = 'transcript') {
  const script = document.createElement('script');
  script.type = 'application/x-ndjson';
  script.id = id;
  script.textContent = text;
  document.body.append(script);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('readBakedSlot', () => {
  it('reads the text baked into the slot', () => {
    slot('{"type":"user"}\n{"type":"assistant"}');
    expect(readBakedSlot(document, 'transcript')).toBe('{"type":"user"}\n{"type":"assistant"}');
  });

  it('reads only the slot it names', () => {
    slot('T');
    slot('{"version":1}', 'annotations');
    expect(readBakedSlot(document, 'annotations')).toBe('{"version":1}');
  });

  it('unescapes &lt;, &gt; and &amp; exactly once, in one pass', () => {
    slot('&lt;/script&gt; &amp;lt; &amp;amp; &quot;');
    expect(readBakedSlot(document, 'transcript')).toBe('</script> &lt; &amp; &quot;');
  });

  it('finds nothing when the slot is empty', () => {
    slot('');
    expect(readBakedSlot(document, 'transcript')).toBeUndefined();
  });

  it('finds nothing when the page has no slot', () => {
    expect(readBakedSlot(document, 'transcript')).toBeUndefined();
  });
});
