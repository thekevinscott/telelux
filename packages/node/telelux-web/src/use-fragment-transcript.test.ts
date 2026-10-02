import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type LoadContext, type LoadState, loadFragment } from './load-fragment';
import { useFragmentTranscript } from './use-fragment-transcript';

vi.mock('./load-fragment', async () => {
  const actual = await vi.importActual<typeof import('./load-fragment')>('./load-fragment');
  return { ...actual, loadFragment: vi.fn<typeof actual.loadFragment>() };
});

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

function contextOf(call: number): LoadContext {
  return vi.mocked(loadFragment).mock.calls[call][1];
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
    expect(result.current.state).toStrictEqual({ kind: 'pending' });
    expect(loadFragment).toHaveBeenLastCalledWith('#first', expect.anything());
    await act(async () => load.resolve({ kind: 'transcript', text: 'one' }));
    expect(result.current.state).toStrictEqual({ kind: 'transcript', text: 'one' });
  });

  it('shows the progress a load reports while it runs', async () => {
    const load = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(load.promise);
    const { result } = renderHook(() => useFragmentTranscript());
    const progress: LoadState = { kind: 'loading', url: 'https://a/t', received: 1, total: 2 };
    act(() => contextOf(0).onProgress(progress));
    expect(result.current.state).toStrictEqual(progress);
  });

  it('keeps the shown result while a new fragment loads, then replaces it', async () => {
    vi.mocked(loadFragment).mockResolvedValueOnce({ kind: 'transcript', text: 'one' });
    const { result } = renderHook(() => useFragmentTranscript());
    await waitFor(() => expect(result.current.state).toStrictEqual({ kind: 'transcript', text: 'one' }));
    const next = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(next.promise);
    act(() => changeHash('#second'));
    expect(loadFragment).toHaveBeenLastCalledWith('#second', expect.anything());
    expect(result.current.state).toStrictEqual({ kind: 'transcript', text: 'one' });
    await act(async () => next.resolve({ kind: 'error', message: 'nope', retry: false }));
    expect(result.current.state).toStrictEqual({ kind: 'error', message: 'nope', retry: false });
  });

  it('aborts and ignores an older load once a newer one starts', async () => {
    const older = deferred();
    const newer = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const { result } = renderHook(() => useFragmentTranscript());
    act(() => changeHash('#newer'));
    expect(contextOf(0).signal.aborted).toBe(true);
    expect(contextOf(1).signal.aborted).toBe(false);
    await act(async () => newer.resolve({ kind: 'transcript', text: 'newer' }));
    act(() => contextOf(0).onProgress({ kind: 'loading', url: 'https://a/t', received: 1, total: undefined }));
    await act(async () => older.resolve({ kind: 'transcript', text: 'older' }));
    expect(result.current.state).toStrictEqual({ kind: 'transcript', text: 'newer' });
  });

  it('shares one cache across loads', async () => {
    vi.mocked(loadFragment).mockResolvedValue({ kind: 'empty' });
    renderHook(() => useFragmentTranscript());
    act(() => changeHash('#again'));
    expect(contextOf(0).cache).toBeInstanceOf(Map);
    expect(contextOf(1).cache).toBe(contextOf(0).cache);
  });

  it('cancel aborts the load in flight', async () => {
    vi.mocked(loadFragment).mockReturnValueOnce(deferred().promise);
    const { result } = renderHook(() => useFragmentTranscript());
    act(() => result.current.cancel());
    expect(contextOf(0).signal.aborted).toBe(true);
  });

  it('retry loads the current fragment again', async () => {
    window.history.replaceState(null, '', '#flaky');
    vi.mocked(loadFragment)
      .mockResolvedValueOnce({ kind: 'error', message: 'down', retry: true })
      .mockResolvedValueOnce({ kind: 'transcript', text: 'up' });
    const { result } = renderHook(() => useFragmentTranscript());
    await waitFor(() => expect(result.current.state).toMatchObject({ kind: 'error' }));
    await act(async () => result.current.retry());
    expect(vi.mocked(loadFragment).mock.calls.map(([hash]) => hash)).toStrictEqual(['#flaky', '#flaky']);
    expect(result.current.state).toStrictEqual({ kind: 'transcript', text: 'up' });
  });

  it('ignores the load from an effect run React has already torn down', async () => {
    const discarded = deferred();
    const kept = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(discarded.promise).mockReturnValueOnce(kept.promise);
    const { result } = renderHook(() => useFragmentTranscript(), { reactStrictMode: true });
    expect(loadFragment).toHaveBeenCalledTimes(2);
    await act(async () => kept.resolve({ kind: 'transcript', text: 'kept' }));
    await act(async () => discarded.resolve({ kind: 'transcript', text: 'discarded' }));
    expect(result.current.state).toStrictEqual({ kind: 'transcript', text: 'kept' });
  });

  it('stops listening, aborts, and ignores in-flight loads once unmounted', async () => {
    const load = deferred();
    vi.mocked(loadFragment).mockReturnValueOnce(load.promise);
    const { result, unmount } = renderHook(() => useFragmentTranscript());
    unmount();
    expect(contextOf(0).signal.aborted).toBe(true);
    await act(async () => load.resolve({ kind: 'transcript', text: 'late' }));
    expect(result.current.state).toStrictEqual({ kind: 'pending' });
    act(() => changeHash('#after'));
    expect(loadFragment).toHaveBeenCalledTimes(1);
  });
});
