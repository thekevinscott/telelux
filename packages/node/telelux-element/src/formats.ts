import { parseClaudeCode } from './claude-code/parse';
import { sniffClaudeCode } from './claude-code/sniff';
import type { ParseResult } from './transcript';

export type FormatAdapter = {
  sniff: (text: string) => boolean;
  parse: (text: string) => ParseResult;
};

export const formats = {
  'claude-code': { sniff: sniffClaudeCode, parse: parseClaudeCode },
} satisfies Record<string, FormatAdapter>;

export type Format = keyof typeof formats;
