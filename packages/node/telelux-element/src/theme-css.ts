export type ThemeToken = { name: string; light: string; dark: string };

export function themeCss(tokens: ThemeToken[]): string {
  const declarations = (scheme: 'light' | 'dark') =>
    [...tokens.map((token) => `--_${token.name}: var(--telelux-${token.name}, ${token[scheme]});`), `color-scheme: ${scheme};`].join(' ');
  return [
    `:host { ${declarations('light')} }`,
    `:host([theme='dark']) { ${declarations('dark')} }`,
    `@media (prefers-color-scheme: dark) { :host(:not([theme])) { ${declarations('dark')} } }`,
  ].join('\n');
}
