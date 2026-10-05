import { describe, expect, it, vi } from 'vitest';
import { readViewer } from './read-viewer';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, readFileSync: vi.fn(() => '<!doctype html>') };
});

describe('readViewer', () => {
  it('reads the viewer asset as UTF-8', () => expect(readViewer()).toBe('<!doctype html>'));
});
