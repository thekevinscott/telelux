import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type LoadState, loadFragment } from './load-fragment';
import { useFragmentTranscript } from './use-fragment-transcript';

vi.mock('./load-fragment', () => ({ loadFragment: vi.fn() }));

function deferred() {
  let resolve!: (state: LoadState) => void;
  const promise = new Promise<LoadState>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function changeHash(hash: string) {
  window.history.replaceState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

afterEach(() => {
  window.history.replaceState(null, '', '#');
  vi.mocked(loadFragment).mockReset();
});

describe('useFragmentTranscript', () => {
  it('is pending until the current fragment loads, then holds the result', async () => {
    window.history.replaceState(null, '', '#first');
    const load = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(load.promise);
    const { result } = renderHook(() => useFragmentTranscript());
    expect(result.current).toStrictEqual({ kind: 'pending' });
    expect(loadFragment).toHaveBeenLastCalledWith('#first');
    await act(async () => load.resolve({ kind: 'transcript', text: 'one' }));
    expect(result.current).toStrictEqual({ kind: 'transcript', text: 'one' });
  });

  it('keeps the shown result while a new fragment loads, then replaces it', async () => {
    vi.mocked(loadFragment).mockResolvedValueOnce({ kind: 'transcript', text: 'one' });
    const { result } = renderHook(() => useFragmentTranscript());
    await waitFor(() => expect(result.current).toStrictEqual({ kind: 'transcript', text: 'one' }));
    const next = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(next.promise);
    act(() => changeHash('#second'));
    expect(loadFragment).toHaveBeenLastCalledWith('#second');
    expect(result.current).toStrictEqual({ kind: 'transcript', text: 'one' });
    await act(async () => next.resolve({ kind: 'error', message: 'nope' }));
    expect(result.current).toStrictEqual({ kind: 'error', message: 'nope' });
  });

  it('ignores an older load that finishes after a newer one', async () => {
    const older = deferred();
    const newer = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const { result } = renderHook(() => useFragmentTranscript());
    act(() => changeHash('#newer'));
    await act(async () => newer.resolve({ kind: 'transcript', text: 'newer' }));
    await act(async () => older.resolve({ kind: 'transcript', text: 'older' }));
    expect(result.current).toStrictEqual({ kind: 'transcript', text: 'newer' });
  });

  it('stops listening and ignores in-flight loads once unmounted', async () => {
    const load = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(load.promise);
    const { result, unmount } = renderHook(() => useFragmentTranscript());
    unmount();
    await act(async () => load.resolve({ kind: 'transcript', text: 'late' }));
    expect(result.current).toStrictEqual({ kind: 'pending' });
    act(() => changeHash('#after'));
    expect(loadFragment).toHaveBeenCalledTimes(1);
  });
});
