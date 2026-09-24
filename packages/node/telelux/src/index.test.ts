import { describe, expect, it } from 'vitest';

import { render } from './index';

describe('index', () => {
  it('exposes render as the package entry', () => {
    expect(render).toBeTypeOf('function');
  });
});
