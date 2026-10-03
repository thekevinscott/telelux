import { describe, expect, it, vi } from 'vitest';

import { prepareAnnotationsFile } from './prepare-annotations-file';
import { readSidecar } from './read-sidecar';

vi.mock('./read-sidecar', async () => {
  const actual = await vi.importActual<typeof import('./read-sidecar')>('./read-sidecar');
  const readSidecar: typeof actual.readSidecar = (text, name) =>
    text === 'bad' ? { ok: false, error: `${name} is not valid JSON.` } : { ok: true, annotations: { version: 1, annotations: [] } };
  return { ...actual, readSidecar: vi.fn(readSidecar) };
});

function sized(size: number): File {
  const big = new File([], 'big.json');
  Object.defineProperty(big, 'size', { value: size });
  big.arrayBuffer = vi.fn(async () => new ArrayBuffer(0));
  return big;
}

describe('prepareAnnotationsFile', () => {
  it('ignores an empty selection', async () => {
    expect(await prepareAnnotationsFile([])).toStrictEqual({ kind: 'none' });
  });

  it('reads one file as a UTF-8 sidecar', async () => {
    expect(await prepareAnnotationsFile([new File(['{"é":1}'], 'a.json')])).toStrictEqual({
      kind: 'annotations',
      annotations: { version: 1, annotations: [] },
    });
    expect(readSidecar).toHaveBeenLastCalledWith('{"é":1}', 'a.json');
  });

  it('passes on why the text is not a sidecar', async () => {
    expect(await prepareAnnotationsFile([new File(['bad'], 'a.json')])).toStrictEqual({ kind: 'error', message: 'a.json is not valid JSON.' });
  });

  it('refuses more than one file', async () => {
    expect(await prepareAnnotationsFile([new File([''], 'a'), new File([''], 'b')])).toStrictEqual({
      kind: 'error',
      message: 'Open one annotations file at a time; 2 were given.',
    });
  });

  it('accepts a file of exactly 50 MiB and refuses a larger one before reading it', async () => {
    await prepareAnnotationsFile([sized(50 * 1024 * 1024)]);
    expect(readSidecar).toHaveBeenLastCalledWith('', 'big.json');
    const big = sized(50 * 1024 * 1024 + 1);
    expect(await prepareAnnotationsFile([big])).toStrictEqual({ kind: 'error', message: 'big.json is 50.0 MiB; the limit is 50 MiB.' });
    expect(big.arrayBuffer).not.toHaveBeenCalled();
  });

  it('says when the file cannot be read', async () => {
    const folder = new File([], 'folder');
    folder.arrayBuffer = vi.fn(async () => {
      throw new Error('NotReadableError');
    });
    expect(await prepareAnnotationsFile([folder])).toStrictEqual({
      kind: 'error',
      message: 'Could not read folder. Open a single annotations file, not a folder.',
    });
  });

  it('refuses text that is not UTF-8', async () => {
    expect(await prepareAnnotationsFile([new File([new Uint8Array([0xff])], 'a.json')])).toStrictEqual({
      kind: 'error',
      message: 'a.json is not valid UTF-8 text.',
    });
  });
});
