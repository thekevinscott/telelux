import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFileDrop } from './use-file-drop';

function drag(type: 'dragover' | 'drop', files: File[] = []): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  window.dispatchEvent(event);
  return event;
}

describe('useFileDrop', () => {
  it('lets files be dropped anywhere on the page', () => {
    renderHook(() => useFileDrop(vi.fn()));
    expect(drag('dragover').defaultPrevented).toBe(true);
  });

  it('hands the dropped files over instead of letting the browser open them', () => {
    const onDrop = vi.fn();
    renderHook(() => useFileDrop(onDrop));
    const files = [new File(['x'], 'a.jsonl')];
    expect(drag('drop', files).defaultPrevented).toBe(true);
    expect(onDrop).toHaveBeenCalledWith(files);
  });

  it('hands over no files when the drop carries none', () => {
    const onDrop = vi.fn();
    renderHook(() => useFileDrop(onDrop));
    const event = new Event('drop', { cancelable: true });
    window.dispatchEvent(event);
    expect(onDrop).toHaveBeenCalledWith([]);
  });

  it('calls the newest handler after a rerender', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ onDrop }) => useFileDrop(onDrop), { initialProps: { onDrop: first } });
    rerender({ onDrop: second });
    drag('drop');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops listening once unmounted', () => {
    const onDrop = vi.fn();
    const { unmount } = renderHook(() => useFileDrop(onDrop), { reactStrictMode: true });
    unmount();
    expect(drag('dragover').defaultPrevented).toBe(false);
    drag('drop');
    expect(onDrop).not.toHaveBeenCalled();
  });
});
