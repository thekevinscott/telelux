import { describe, expect, it } from 'vitest';

import { linkForUrl } from './link-for-url';

describe('linkForUrl', () => {
  it('turns an https URL into a hosted transcript link', () => {
    expect(linkForUrl('https://example.com/t.jsonl?token=a%2Fb')).toEqual({
      kind: 'link',
      hash: '#v=1&data=https://example.com/t.jsonl?token=a%2Fb',
    });
  });

  it('accepts http, ignoring surrounding whitespace and normalizing the scheme', () => {
    expect(linkForUrl('  HTTP://example.com/t.jsonl\n')).toEqual({
      kind: 'link',
      hash: '#v=1&data=http://example.com/t.jsonl',
    });
  });

  it('asks for a URL when the input is blank', () => {
    expect(linkForUrl(' \t')).toEqual({ kind: 'invalid', message: 'Enter a transcript URL.' });
  });

  it.each(['example.com/t.jsonl', 'ftp://example.com/t.jsonl', 'javascript:alert(1)', 'https://exa mple.com'])(
    'rejects %j as not an http(s) URL',
    (input) => {
      expect(linkForUrl(input)).toEqual({
        kind: 'invalid',
        message: 'Enter a URL that starts with http:// or https://.',
      });
    },
  );
});
