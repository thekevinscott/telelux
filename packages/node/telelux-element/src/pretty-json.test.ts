import { describe, expect, it } from 'vitest';

import { prettyJson } from './pretty-json';

describe('prettyJson', () => {
  it('indents a JSON object by two spaces', () => {
    expect(prettyJson('{"a":1,"b":{"c":[true]}}')).toBe('{\n  "a": 1,\n  "b": {\n    "c": [\n      true\n    ]\n  }\n}');
  });

  it('indents a JSON array', () => {
    expect(prettyJson('[1,"x"]')).toBe('[\n  1,\n  "x"\n]');
  });

  it('accepts surrounding whitespace', () => {
    expect(prettyJson('\n  {"a":1}  \n')).toBe('{\n  "a": 1\n}');
  });

  it.each(['"text"', '3', 'true', 'null'])('rejects the JSON scalar %s', (text) => {
    expect(prettyJson(text)).toBeUndefined();
  });

  it('rejects text that is not JSON', () => {
    expect(prettyJson('{not json}')).toBeUndefined();
    expect(prettyJson('plain words')).toBeUndefined();
  });
});
