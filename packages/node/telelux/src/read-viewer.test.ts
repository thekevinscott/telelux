import { describe, expect, it, vi } from 'vitest';
import { readViewer } from './read-viewer';
import { readFileSync } from 'node:fs';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, readFileSync: vi.fn(() => '<!doctype html>') };
});

describe('readViewer', () => {
  it('reads the packaged viewer asset as UTF-8', () => {
    expect(readViewer()).toBe('<!doctype html>');
    const [path, encoding] = vi.mocked(readFileSync).mock.calls[0];
    expect(String(path).replaceAll('\\', '/')).toMatch(/\/telelux\/dist\/viewer\.html$/);
    expect(encoding).toBe('utf8');
  });
});
