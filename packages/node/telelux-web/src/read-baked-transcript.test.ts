import { afterEach, describe, expect, it } from 'vitest';

import { readBakedTranscript } from './read-baked-transcript';

function slot(text: string) {
  const script = document.createElement('script');
  script.type = 'application/x-ndjson';
  script.id = 'transcript';
  script.textContent = text;
  document.body.append(script);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('readBakedTranscript', () => {
  it('reads the text baked into the slot', () => {
    slot('{"type":"user"}\n{"type":"assistant"}');
    expect(readBakedTranscript(document)).toBe('{"type":"user"}\n{"type":"assistant"}');
  });

  it('unescapes &lt;, &gt; and &amp; exactly once, in one pass', () => {
    slot('&lt;/script&gt; &amp;lt; &amp;amp; &quot;');
    expect(readBakedTranscript(document)).toBe('</script> &lt; &amp; &quot;');
  });

  it('finds nothing when the slot is empty', () => {
    slot('');
    expect(readBakedTranscript(document)).toBeUndefined();
  });

  it('finds nothing when the page has no slot', () => {
    expect(readBakedTranscript(document)).toBeUndefined();
  });
});
