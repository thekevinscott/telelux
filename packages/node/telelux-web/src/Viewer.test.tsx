import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Viewer } from './Viewer';

describe('Viewer', () => {
  it('hands the raw transcript text to telelux-transcript as its only child', () => {
    const { container } = render(<Viewer text={'{"type":"user"}\n{"type":"assistant"}'} />);
    const element = container.querySelector('telelux-transcript');
    expect(container.children).toHaveLength(1);
    expect(element?.childNodes).toHaveLength(1);
    expect(element?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(element?.textContent).toBe('{"type":"user"}\n{"type":"assistant"}');
  });

  it('keeps markup in the text as text', () => {
    const { container } = render(<Viewer text={'{"content":"<b>x</b>"}'} />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('telelux-transcript')?.textContent).toBe('{"content":"<b>x</b>"}');
  });
});
