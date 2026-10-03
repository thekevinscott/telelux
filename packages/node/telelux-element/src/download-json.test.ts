import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadJson } from './download-json';

describe('downloadJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('clicks a download link to a JSON blob and revokes the URL afterwards', async () => {
    vi.useFakeTimers();
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:fake';
    });
    URL.revokeObjectURL = vi.fn();
    const clicks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this);
    });

    downloadJson('t.annotations.json', { version: 1, annotations: [] });

    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe('t.annotations.json');
    expect(clicks[0].getAttribute('href')).toBe('blob:fake');
    expect(blobs[0].type).toBe('application/json');
    expect(await blobs[0].text()).toBe('{\n  "version": 1,\n  "annotations": []\n}\n');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});
