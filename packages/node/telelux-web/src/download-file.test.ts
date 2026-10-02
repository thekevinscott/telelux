import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadFile } from './download-file';

let clicked: { href: string; download: string; attached: boolean }[];

beforeEach(() => {
  clicked = [];
  vi.useFakeTimers();
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push({ href: this.href, download: this.download, attached: this.isConnected });
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('downloadFile', () => {
  it('saves the contents as an HTML blob under the given name', async () => {
    downloadFile('session.html', '<!doctype html><p>hi</p>');
    expect(clicked).toStrictEqual([{ href: 'blob:fake', download: 'session.html', attached: true }]);
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/html');
    expect(await blob.text()).toBe('<!doctype html><p>hi</p>');
  });

  it('leaves no link behind and frees the blob after the click', () => {
    downloadFile('session.html', 'x');
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});
