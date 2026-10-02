import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { useFragmentTranscript } from './use-fragment-transcript';

vi.mock('./use-fragment-transcript', () => ({ useFragmentTranscript: vi.fn() }));
vi.mock('./Viewer', () => ({ Viewer: ({ text }: { text: string }) => <output data-testid="viewer">{text}</output> }));

describe('App', () => {
  it('renders nothing while the fragment loads', () => {
    vi.mocked(useFragmentTranscript).mockReturnValue({ kind: 'pending' });
    expect(render(<App />).container).toBeEmptyDOMElement();
  });

  it('says no transcript is loaded when there is no fragment', () => {
    vi.mocked(useFragmentTranscript).mockReturnValue({ kind: 'empty' });
    const { container } = render(<App />);
    expect(container).toHaveTextContent('No transcript loaded. Open a transcript link to view one.');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows a load error as an alert', () => {
    vi.mocked(useFragmentTranscript).mockReturnValue({ kind: 'error', message: 'Bad link.' });
    const { getByRole } = render(<App />);
    expect(getByRole('alert')).toHaveTextContent('Bad link.');
    expect(getByRole('alert')).toHaveClass('load-error');
  });

  it('hands loaded text to the viewer', () => {
    vi.mocked(useFragmentTranscript).mockReturnValue({ kind: 'transcript', text: '{"type":"user"}' });
    const { getByTestId, container } = render(<App />);
    expect(getByTestId('viewer')).toHaveTextContent('{"type":"user"}');
    expect(container.children).toHaveLength(1);
  });
});
