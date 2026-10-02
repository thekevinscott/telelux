import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import type { LoadState } from './load-fragment';
import { useFragmentTranscript } from './use-fragment-transcript';

vi.mock('./use-fragment-transcript', async () => {
  const actual = await vi.importActual<typeof import('./use-fragment-transcript')>('./use-fragment-transcript');
  return { ...actual, useFragmentTranscript: vi.fn<typeof actual.useFragmentTranscript>() };
});

vi.mock('./Viewer', async () => {
  const actual = await vi.importActual<typeof import('./Viewer')>('./Viewer');
  const Viewer: typeof actual.Viewer = ({ text }) => <output data-testid="viewer">{text}</output>;
  return { ...actual, Viewer };
});

vi.mock('./format-progress', async () => {
  const actual = await vi.importActual<typeof import('./format-progress')>('./format-progress');
  const formatProgress: typeof actual.formatProgress = (received, total) => `${received}/${total}`;
  return { ...actual, formatProgress };
});

const cancel = vi.fn();
const retry = vi.fn();

function given(state: LoadState) {
  vi.mocked(useFragmentTranscript).mockReturnValue({ state, cancel, retry });
}

beforeEach(() => {
  cancel.mockReset();
  retry.mockReset();
});

describe('App', () => {
  it('renders nothing while the fragment loads', () => {
    given({ kind: 'pending' });
    expect(render(<App />).container).toBeEmptyDOMElement();
  });

  it('says no transcript is loaded when there is no fragment', () => {
    given({ kind: 'empty' });
    const { container } = render(<App />);
    expect(container).toHaveTextContent('No transcript loaded. Open a transcript link to view one.');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows hosted-link progress with a working Cancel button', () => {
    given({ kind: 'loading', url: 'https://example.com/t.jsonl', received: 3, total: 9 });
    const { getByRole } = render(<App />);
    expect(getByRole('status')).toHaveTextContent('Loading https://example.com/t.jsonl (3/9)… Cancel');
    expect(getByRole('status')).toHaveClass('loading');
    fireEvent.click(getByRole('button', { name: 'Cancel' }));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('shows a load error as an alert, with no Retry when retrying cannot help', () => {
    given({ kind: 'error', message: 'Bad link.', retry: false });
    const { getByRole, queryByRole } = render(<App />);
    expect(getByRole('alert')).toHaveTextContent(/^Bad link\.$/);
    expect(getByRole('alert')).toHaveClass('load-error');
    expect(queryByRole('button')).toBeNull();
  });

  it('offers a working Retry button for a failed fetch', () => {
    given({ kind: 'error', message: 'HTTP 503.', retry: true });
    const { getByRole } = render(<App />);
    expect(getByRole('alert')).toHaveTextContent('HTTP 503. Retry');
    fireEvent.click(getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('hands loaded text to the viewer', () => {
    given({ kind: 'transcript', text: '{"type":"user"}' });
    const { getByTestId, container } = render(<App />);
    expect(getByTestId('viewer')).toHaveTextContent('{"type":"user"}');
    expect(container.children).toHaveLength(1);
  });
});
