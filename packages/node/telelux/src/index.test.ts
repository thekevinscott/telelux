import { describe, expect, it } from 'vitest';

import { Telelux } from './index';

describe('index', () => {
  it('exposes Telelux as the package entry', () => {
    expect(Telelux).toBeTypeOf('function');
  });
});
