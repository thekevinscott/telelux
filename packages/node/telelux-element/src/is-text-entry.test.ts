import { describe, expect, it } from 'vitest';

import { isTextEntry } from './is-text-entry';

describe('isTextEntry', () => {
  it.each(['input', 'textarea', 'select'])('is true for a %s', (tag) => {
    expect(isTextEntry(document.createElement(tag))).toBe(true);
  });

  it('is true inside a contenteditable element', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', '');
    const span = div.appendChild(document.createElement('span'));
    expect(isTextEntry(div)).toBe(true);
    expect(isTextEntry(span)).toBe(true);
  });

  it('is false where contenteditable is switched off', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'false');
    expect(isTextEntry(div)).toBe(false);
  });

  it('is false for other elements', () => {
    expect(isTextEntry(document.createElement('button'))).toBe(false);
    expect(isTextEntry(document.createElement('div'))).toBe(false);
  });

  it('is false for no target, or a target that is not an element', () => {
    expect(isTextEntry(undefined)).toBe(false);
    expect(isTextEntry(window)).toBe(false);
  });
});
