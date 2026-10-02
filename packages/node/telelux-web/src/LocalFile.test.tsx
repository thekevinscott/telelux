import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bakeTranscript } from './bake-transcript';
import { downloadFile } from './download-file';
import { LocalFile } from './LocalFile';
import { type LocalFileResult, prepareLocalFile } from './prepare-local-file';
import { useFileDrop } from './use-file-drop';

vi.mock('./prepare-local-file', async () => {
  const actual = await vi.importActual<typeof import('./prepare-local-file')>('./prepare-local-file');
  return { ...actual, prepareLocalFile: vi.fn<typeof actual.prepareLocalFile>() };
});

vi.mock('./use-file-drop', async () => {
  const actual = await vi.importActual<typeof import('./use-file-drop')>('./use-file-drop');
  return { ...actual, useFileDrop: vi.fn<typeof actual.useFileDrop>() };
});

vi.mock('./bake-transcript', async () => {
  const actual = await vi.importActual<typeof import('./bake-transcript')>('./bake-transcript');
  const bakeTranscript: typeof actual.bakeTranscript = (html, text) => `${html}+${text}`;
  return { ...actual, bakeTranscript: vi.fn(bakeTranscript) };
});

vi.mock('./standalone-name', async () => {
  const actual = await vi.importActual<typeof import('./standalone-name')>('./standalone-name');
  const standaloneName: typeof actual.standaloneName = (name) => `${name}.html`;
  return { ...actual, standaloneName };
});

vi.mock('./download-file', async () => {
  const actual = await vi.importActual<typeof import('./download-file')>('./download-file');
  return { ...actual, downloadFile: vi.fn<typeof actual.downloadFile>() };
});

function given(result: LocalFileResult) {
  vi.mocked(prepareLocalFile).mockResolvedValue(result);
}

function picker(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error('no file input');
  }
  return input;
}

async function pick(container: HTMLElement, files: File[]) {
  await act(async () => {
    fireEvent.change(picker(container), { target: { files } });
  });
}

beforeEach(() => {
  window.history.replaceState(null, '', '/viewer.html?x=1#v=1&data=old');
  vi.mocked(prepareLocalFile).mockReset();
  vi.mocked(downloadFile).mockReset();
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('LocalFile', () => {
  it('opens the hidden file input from an accessible button', () => {
    const { container, getByRole } = render(<LocalFile pristineHtml="" />);
    const input = picker(container);
    expect(input.hidden).toBe(true);
    expect(input.multiple).toBe(false);
    const click = vi.spyOn(input, 'click');
    fireEvent.click(getByRole('button', { name: 'Open a transcript file' }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('Open a transcript file or drop one anywhere on the page.');
  });

  it('navigates to the link a picked file fits in', async () => {
    given({ kind: 'link', hash: '#v=1&data=abc' });
    const { container } = render(<LocalFile pristineHtml="" />);
    const file = new File(['x'], 'a.jsonl');
    await pick(container, [file]);
    expect(prepareLocalFile).toHaveBeenCalledWith([file], `${window.location.origin}/viewer.html?x=1`);
    expect(window.location.hash).toBe('#v=1&data=abc');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('clears the picker so the same file can be picked again', async () => {
    given({ kind: 'none' });
    const { container } = render(<LocalFile pristineHtml="" />);
    const input = picker(container);
    Object.defineProperty(input, 'value', { value: 'C:\\fakepath\\a.jsonl', writable: true });
    await pick(container, [new File(['x'], 'a.jsonl')]);
    expect(input.value).toBe('');
  });

  it('treats a change with no file list as an empty selection', async () => {
    given({ kind: 'none' });
    const { container } = render(<LocalFile pristineHtml="" />);
    await act(async () => {
      fireEvent.change(picker(container), { target: { files: null } });
    });
    expect(prepareLocalFile).toHaveBeenCalledWith([], expect.any(String));
  });

  it('hands files dropped on the page to the same flow', async () => {
    given({ kind: 'link', hash: '#v=1&data=dropped' });
    render(<LocalFile pristineHtml="" />);
    const file = new File(['x'], 'b.jsonl');
    await act(async () => vi.mocked(useFileDrop).mock.lastCall?.[0]([file]));
    expect(prepareLocalFile).toHaveBeenCalledWith([file], expect.any(String));
    expect(window.location.hash).toBe('#v=1&data=dropped');
  });

  it('shows why a file cannot be opened, and leaves the page where it was', async () => {
    given({ kind: 'error', message: 'Could not read logs.' });
    const { container, getByRole } = render(<LocalFile pristineHtml="" />);
    await pick(container, [new File([''], 'logs')]);
    expect(getByRole('alert')).toHaveTextContent(/^Could not read logs\.$/);
    expect(getByRole('alert')).toHaveClass('load-error');
    expect(window.location.hash).toBe('#v=1&data=old');
  });

  it('clears an old error once a later file opens', async () => {
    given({ kind: 'error', message: 'Nope.' });
    const { container } = render(<LocalFile pristineHtml="" />);
    await pick(container, [new File([''], 'a')]);
    given({ kind: 'link', hash: '#v=1&data=ok' });
    await pick(container, [new File([''], 'b')]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('offers a too-large file as a standalone HTML download of this page', async () => {
    given({ kind: 'too-large', name: 'long.jsonl', text: 'TEXT', message: 'long.jsonl is too large.' });
    const { container, getByRole } = render(<LocalFile pristineHtml="PAGE" />);
    await pick(container, [new File(['x'], 'long.jsonl')]);
    expect(getByRole('alert')).toHaveTextContent('long.jsonl is too large. Download standalone HTML');
    expect(window.location.hash).toBe('#v=1&data=old');
    expect(downloadFile).not.toHaveBeenCalled();
    fireEvent.click(getByRole('button', { name: 'Download standalone HTML' }));
    expect(bakeTranscript).toHaveBeenCalledWith('PAGE', 'TEXT');
    expect(downloadFile).toHaveBeenCalledWith('long.jsonl.html', 'PAGE+TEXT');
  });
});
