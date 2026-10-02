import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
import { describe, expect, it } from 'vitest';

import { ThemeContext } from './theme-context';

describe('ThemeContext', () => {
  it('defaults to paper outside a provider', () => {
    expect(renderHook(() => useContext(ThemeContext)).result.current).toBe('paper');
  });
});
