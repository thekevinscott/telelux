import { act, fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnnotationsFile } from './AnnotationsFile';
import { type AnnotationsFileResult, prepareAnnotationsFile } from './prepare-annotations-file';

vi.mock('./prepare-annotations-file', async () => {
  const actual = await vi.importActual<typeof import('./prepare-annotations-file')>('./prepare-annotations-file');
  return { ...actual, prepareAnnotationsFile: vi.fn<typeof actual.prepareAnnotationsFile>() };
});

function picker(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error('no file input');
  }
  return input;
}

beforeEach(() => {
  vi.mocked(prepareAnnotationsFile).mockReset();
  vi.mocked(prepareAnnotationsFile).mockResolvedValue({ kind: 'none' });
});

describe('AnnotationsFile', () => {
  it('opens a hidden, single-file JSON input from an accessible button', () => {
    const { container, getByRole } = render(<AnnotationsFile onOpen={vi.fn()} />);
    const input = picker(container);
    expect(input.hidden).toBe(true);
    expect(input.multiple).toBe(false);
    expect(input.accept).toBe('.json,application/json');
    const click = vi.spyOn(input, 'click');
    fireEvent.click(getByRole('button', { name: 'Open an annotations file' }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent('Open an annotations file to review alongside this transcript.');
  });

  it('hands what the picked file holds to onOpen and clears the picker', async () => {
    const result: AnnotationsFileResult = { kind: 'annotations', annotations: { version: 1, annotations: [] } };
    vi.mocked(prepareAnnotationsFile).mockResolvedValue(result);
    const onOpen = vi.fn();
    const { container } = render(<AnnotationsFile onOpen={onOpen} />);
    const input = picker(container);
    Object.defineProperty(input, 'value', { value: 'C:\\fakepath\\a.json', writable: true });
    const file = new File(['{}'], 'a.json');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(prepareAnnotationsFile).toHaveBeenCalledWith([file]);
    expect(onOpen).toHaveBeenCalledWith(result);
    expect(input.value).toBe('');
  });

  it('treats a change with no file list as an empty selection', async () => {
    const { container } = render(<AnnotationsFile onOpen={vi.fn()} />);
    await act(async () => {
      fireEvent.change(picker(container), { target: { files: null } });
    });
    expect(prepareAnnotationsFile).toHaveBeenCalledWith([]);
  });

  it('shows an error as an alert that keeps its line breaks', () => {
    const { getByRole } = render(<AnnotationsFile onOpen={vi.fn()} error={'a.json is not an annotations file:\n✖ Invalid input'} />);
    expect(getByRole('alert').textContent).toBe('a.json is not an annotations file:\n✖ Invalid input');
    expect(getByRole('alert')).toHaveClass('load-error', 'annotations-error');
  });

  it('shows no alert without an error', () => {
    const { container } = render(<AnnotationsFile onOpen={vi.fn()} />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
