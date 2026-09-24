import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TranscriptBox } from './TranscriptBox';

describe('TranscriptBox', () => {
  it('displays the text it is given', () => {
    render(<TranscriptBox text="hello transcript" />);
    expect(screen.getByTestId('transcript-box')).toHaveTextContent('hello transcript');
  });

  it('carries the class the black-box styling hangs off', () => {
    render(<TranscriptBox text="x" />);
    expect(screen.getByTestId('transcript-box')).toHaveClass('transcript-box');
  });

  it('keeps the text verbatim, newlines included', () => {
    render(<TranscriptBox text={'a\nb'} />);
    expect(screen.getByTestId('transcript-box').textContent).toBe('a\nb');
  });
});
