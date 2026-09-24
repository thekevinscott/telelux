import { describe, expect, it } from 'vitest';

import { render } from './index';

describe('render', () => {
  it('throws until the wrap direction with the Python package is decided', () => {
    expect(() => render('')).toThrow('telelux: render is not implemented yet');
  });
});
