import { describe, expect, it } from 'vitest';
import { fillSlot } from './fill-slot';

describe('fillSlot', () => {
  it('escapes HTML metacharacters inside exactly one slot', () => {
    expect(fillSlot('<script id="x"></script>', '<script id="x">', '</script><!-- & >', 'x')).toBe('<script id="x">&lt;/script&gt;&lt;!-- &amp; &gt;</script>');
  });
  it('rejects missing and duplicate slots', () => {
    expect(() => fillSlot('', '<script>', '', 'x')).toThrow('0 x slots');
    expect(() => fillSlot('<script></script><script></script>', '<script>', '', 'x')).toThrow('2 x slots');
  });
});
