import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeContext } from './theme-context';

describe('ThemeContext', () => {
  it('defaults to paper outside a provider', () => {
    const { container } = render(<ThemeContext.Consumer>{(theme) => <output>{theme}</output>}</ThemeContext.Consumer>);
    expect(container).toHaveTextContent('paper');
  });
});
