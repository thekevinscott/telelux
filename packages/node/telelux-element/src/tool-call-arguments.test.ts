import { describe, expect, it } from 'vitest';

import { toolCallArguments } from './tool-call-arguments';

describe('toolCallArguments', () => {
  it('returns an empty string when there are no arguments', () => {
    expect(toolCallArguments(undefined)).toBe('');
    expect(toolCallArguments({})).toBe('');
  });

  it('writes strings as they are', () => {
    expect(toolCallArguments({ path: 'a b.txt' })).toBe('path=a b.txt');
  });

  it('stringifies everything else as JSON', () => {
    expect(toolCallArguments({ n: 3, flag: false, list: [1, 'x'], nested: { a: null } }))
      .toBe('n=3, flag=false, list=[1,"x"], nested={"a":null}');
  });

  it('joins pairs with a comma and a space, in key order', () => {
    expect(toolCallArguments({ b: 'two', a: 'one' })).toBe('b=two, a=one');
  });
});
