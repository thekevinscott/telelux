import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTheme } from './use-theme';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('useTheme', () => {
  describe('on first load', () => {
    it('falls back to paper when nothing is stored', () => {
      expect(renderHook(() => useTheme()).result.current[0]).toBe('paper');
    });

    it.each(['paper', 'cool', 'dark'])('restores a stored %s', (name) => {
      window.localStorage.setItem('telelux-theme', name);
      expect(renderHook(() => useTheme()).result.current[0]).toBe(name);
    });

    it.each(['', 'sepia', 'Dark', ' dark', '"dark"'])('falls back to paper for the unknown stored value %j', (value) => {
      window.localStorage.setItem('telelux-theme', value);
      expect(renderHook(() => useTheme()).result.current[0]).toBe('paper');
    });

    it('falls back to paper when reading storage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      expect(renderHook(() => useTheme()).result.current[0]).toBe('paper');
    });

    it('falls back to paper when storage itself cannot be reached', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      expect(renderHook(() => useTheme()).result.current[0]).toBe('paper');
    });
  });

  describe('choosing a theme', () => {
    it('switches immediately and stores only the theme name', () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current[1]('dark'));
      expect(result.current[0]).toBe('dark');
      expect(window.localStorage.length).toBe(1);
      expect(window.localStorage.getItem('telelux-theme')).toBe('dark');
    });

    it('survives a remount, as after a reload', () => {
      const first = renderHook(() => useTheme());
      act(() => first.result.current[1]('cool'));
      first.unmount();
      expect(renderHook(() => useTheme()).result.current[0]).toBe('cool');
    });

    it('keeps the choice in memory when writing storage throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });
      const { result } = renderHook(() => useTheme());
      act(() => result.current[1]('cool'));
      expect(result.current[0]).toBe('cool');
      act(() => result.current[1]('dark'));
      expect(result.current[0]).toBe('dark');
    });

    it('keeps the choice in memory when storage itself cannot be reached', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      const { result } = renderHook(() => useTheme());
      act(() => result.current[1]('dark'));
      expect(result.current[0]).toBe('dark');
    });

    it('hands back the same setter across renders', () => {
      const { result, rerender } = renderHook(() => useTheme());
      const choose = result.current[1];
      rerender();
      act(() => choose('cool'));
      expect(result.current[1]).toBe(choose);
    });
  });
});
