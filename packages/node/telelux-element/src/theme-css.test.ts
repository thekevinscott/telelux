import { describe, expect, it } from 'vitest';

import { themeCss } from './theme-css';

describe('themeCss', () => {
  const lines = () =>
    themeCss([
      { name: 'foreground', light: '#111', dark: '#eee' },
      { name: 'radius', light: '6px', dark: '6px' },
    ]).split('\n');

  it('declares each private token from its public property, with the light default on the host', () => {
    expect(lines()[0]).toBe(':host { --_foreground: var(--telelux-foreground, #111); --_radius: var(--telelux-radius, 6px); color-scheme: light; }');
  });

  it('switches to the dark defaults under theme="dark"', () => {
    expect(lines()[1]).toBe(":host([theme='dark']) { --_foreground: var(--telelux-foreground, #eee); --_radius: var(--telelux-radius, 6px); color-scheme: dark; }");
  });

  it('follows the dark colour scheme preference only when no theme is set', () => {
    expect(lines()[2]).toBe('@media (prefers-color-scheme: dark) { :host(:not([theme])) { --_foreground: var(--telelux-foreground, #eee); --_radius: var(--telelux-radius, 6px); color-scheme: dark; } }');
  });

  it('has nothing else', () => {
    expect(lines()).toHaveLength(3);
  });
});
