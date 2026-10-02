import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { linkForUrl } from './link-for-url';
import { UrlEntry } from './UrlEntry';

vi.mock('./link-for-url', async () => {
  const actual = await vi.importActual<typeof import('./link-for-url')>('./link-for-url');
  return { ...actual, linkForUrl: vi.fn<typeof actual.linkForUrl>() };
});

function submit(value: string) {
  const view = render(<UrlEntry />);
  fireEvent.change(view.getByRole('textbox', { name: 'Transcript URL' }), { target: { value } });
  fireEvent.click(view.getByRole('button', { name: 'Open' }));
  return view;
}

beforeEach(() => {
  window.location.hash = '';
  vi.mocked(linkForUrl).mockReset();
});

describe('UrlEntry', () => {
  it('offers a labelled URL box with nothing flagged', () => {
    const { container, getByRole, queryByRole } = render(<UrlEntry />);
    expect(container).toHaveTextContent(/^Transcript URL  Open$/, { normalizeWhitespace: false });
    const input = getByRole('textbox', { name: 'Transcript URL' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('type', 'url');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(queryByRole('alert')).toBeNull();
  });

  it('navigates to the link for a valid URL', () => {
    vi.mocked(linkForUrl).mockReturnValue({ kind: 'link', hash: '#v=1&data=https://example.com/t.jsonl' });
    const { queryByRole } = submit('https://example.com/t.jsonl');
    expect(linkForUrl).toHaveBeenCalledWith('https://example.com/t.jsonl');
    expect(window.location.hash).toBe('#v=1&data=https://example.com/t.jsonl');
    expect(queryByRole('alert')).toBeNull();
  });

  it('shows an inline error tied to the box and does not navigate for invalid input', () => {
    vi.mocked(linkForUrl).mockReturnValue({ kind: 'invalid', message: 'Nope.' });
    const { getByRole } = submit('ftp://example.com');
    const alert = getByRole('alert');
    expect(alert).toHaveTextContent(/^Nope\.$/);
    expect(alert).toHaveClass('url-entry-error');
    expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(getByRole('textbox')).toHaveAccessibleDescription('Nope.');
    expect(window.location.hash).toBe('');
  });

  it('clears the error once a valid URL is submitted', () => {
    vi.mocked(linkForUrl)
      .mockReturnValueOnce({ kind: 'invalid', message: 'Nope.' })
      .mockReturnValueOnce({ kind: 'link', hash: '#v=1&data=https://example.com/t.jsonl' });
    const { getByRole, queryByRole } = submit('x');
    fireEvent.click(getByRole('button', { name: 'Open' }));
    expect(queryByRole('alert')).toBeNull();
    expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    expect(window.location.hash).toBe('#v=1&data=https://example.com/t.jsonl');
  });

  it('submits from the keyboard without the browser blocking it', () => {
    vi.mocked(linkForUrl).mockReturnValue({ kind: 'invalid', message: 'Nope.' });
    const { container, getByRole } = render(<UrlEntry />);
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('novalidate');
    expect(form).toHaveClass('url-entry');
    expect(fireEvent.submit(getByRole('textbox'))).toBe(false);
    expect(getByRole('alert')).toHaveTextContent('Nope.');
  });
});
