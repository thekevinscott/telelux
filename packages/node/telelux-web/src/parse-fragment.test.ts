import { describe, expect, it } from 'vitest';

import { parseFragment } from './parse-fragment';

describe('parseFragment', () => {
  it('reads an empty hash as no fragment', () => {
    expect(parseFragment('')).toStrictEqual({ kind: 'none' });
    expect(parseFragment('#')).toStrictEqual({ kind: 'none' });
  });

  it('reads a payload with or without the leading #', () => {
    expect(parseFragment('#v=1&data=H4sIAAAA')).toStrictEqual({ kind: 'payload', data: 'H4sIAAAA' });
    expect(parseFragment('v=1&data=H4sIAAAA')).toStrictEqual({ kind: 'payload', data: 'H4sIAAAA' });
  });

  it('reads http and https values as hosted transcript URLs', () => {
    expect(parseFragment('#v=1&data=https://example.com/t.jsonl')).toStrictEqual({ kind: 'url', url: 'https://example.com/t.jsonl' });
    expect(parseFragment('#v=1&data=http://example.com/t.jsonl')).toStrictEqual({ kind: 'url', url: 'http://example.com/t.jsonl' });
  });

  it('keeps everything after &data= verbatim, including ?, &, = and percent escapes', () => {
    const url = 'https://example.com/t.jsonl?token=a%2Fb&download=1&data=x';
    expect(parseFragment(`#v=1&data=${url}`)).toStrictEqual({ kind: 'url', url });
  });

  it('treats a value that only mentions http as a payload', () => {
    expect(parseFragment('#v=1&data=xhttps://a')).toStrictEqual({ kind: 'payload', data: 'xhttps://a' });
    expect(parseFragment('#v=1&data=https:/a')).toStrictEqual({ kind: 'payload', data: 'https:/a' });
  });

  it('reports a version other than 1', () => {
    expect(parseFragment('#v=2&data=abc')).toStrictEqual({ kind: 'unsupported-version', version: '2' });
    expect(parseFragment('#v=10')).toStrictEqual({ kind: 'unsupported-version', version: '10' });
    expect(parseFragment('#v=')).toStrictEqual({ kind: 'unsupported-version', version: '' });
  });

  it('rejects fragments that are not a v=1&data= envelope', () => {
    expect(parseFragment('#data=abc')).toStrictEqual({ kind: 'malformed' });
    expect(parseFragment('#xv=1&data=abc')).toStrictEqual({ kind: 'malformed' });
    expect(parseFragment('#v=1')).toStrictEqual({ kind: 'malformed' });
    expect(parseFragment('#v=1&dat=abc')).toStrictEqual({ kind: 'malformed' });
    expect(parseFragment('#v=1&datum=abc')).toStrictEqual({ kind: 'malformed' });
    expect(parseFragment('#v=1&data=')).toStrictEqual({ kind: 'malformed' });
  });
});
