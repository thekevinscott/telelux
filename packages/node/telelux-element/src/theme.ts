import { unsafeCSS } from 'lit';

import { type ThemeToken, themeCss } from './theme-css';

export const THEME_TOKENS: ThemeToken[] = [
  { name: 'font-sans', light: 'system-ui, sans-serif', dark: 'system-ui, sans-serif' },
  { name: 'font-mono', light: 'ui-monospace, monospace', dark: 'ui-monospace, monospace' },
  { name: 'font-size', light: '14px', dark: '14px' },
  { name: 'radius', light: '6px', dark: '6px' },
  { name: 'radius-sm', light: '4px', dark: '4px' },
  { name: 'block-padding', light: '8px', dark: '8px' },
  { name: 'block-gap', light: '4px', dark: '4px' },
  { name: 'background', light: '#ffffff', dark: '#111827' },
  { name: 'foreground', light: '#111827', dark: '#f3f4f6' },
  { name: 'muted', light: '#f3f4f6', dark: '#1f2937' },
  { name: 'muted-foreground', light: '#6b7280', dark: '#9ca3af' },
  { name: 'secondary', light: '#f1f5f9', dark: '#1e293b' },
  { name: 'border', light: '#e5e7eb', dark: '#374151' },
  { name: 'destructive', light: '#dc2626', dark: '#f87171' },
  { name: 'highlight', light: '#f59e0b', dark: '#fbbf24' },
  { name: 'shadow', light: 'rgb(0 0 0 / 12%)', dark: 'rgb(0 0 0 / 50%)' },
  { name: 'user-border', light: '#d1d5db', dark: '#4b5563' },
  { name: 'user-background', light: '#f9fafb', dark: '#1f2937' },
  { name: 'assistant-border', light: '#93c5fd', dark: '#3b82f6' },
  { name: 'assistant-background', light: '#eff6ff', dark: '#172554' },
  { name: 'system-border', light: '#fdba74', dark: '#f97316' },
  { name: 'system-background', light: '#fff7ed', dark: '#431407' },
  { name: 'tool-border', light: '#86efac', dark: '#22c55e' },
  { name: 'tool-background', light: '#f0fdf4', dark: '#052e16' },
  { name: 'unknown-border', light: '#d1d5db', dark: '#4b5563' },
  { name: 'unknown-background', light: '#f9fafb', dark: '#1f2937' },
];

export const theme = unsafeCSS(themeCss(THEME_TOKENS));
