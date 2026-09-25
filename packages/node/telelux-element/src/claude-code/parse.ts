import { MAX_RECORDS } from '../limits';
import { splitJsonl } from '../split-jsonl';
import type { ChatMessage, ParseResult } from '../transcript';
import { continuesAssistant } from './continues-assistant';
import { lineMessages } from './line-messages';
import { mergeAssistant } from './merge-assistant';
import { transcriptHeader } from './transcript-header';
import { usageTotals } from './usage-totals';

export function parseClaudeCode(text: string): ParseResult {
  const lines = splitJsonl(text);
  if (lines.length > MAX_RECORDS) {
    return { ok: false, error: `The transcript has ${lines.length} records; the limit is ${MAX_RECORDS}.` };
  }
  const toolNames = new Map<string, string>();
  const messages: ChatMessage[] = [];
  for (const line of lines) {
    for (const message of lineMessages(line, toolNames)) {
      const previous = messages.at(-1);
      if (continuesAssistant(previous, message) && message.role === 'assistant') {
        messages[messages.length - 1] = mergeAssistant(previous, message);
      } else {
        messages.push(message);
      }
    }
  }
  const header = transcriptHeader(lines.flatMap((line) => (line.record === undefined ? [] : [line.record])));
  const metadata = { ...header.metadata, records: lines.length, usage: usageTotals(messages) };
  return { ok: true, transcript: { ...header, messages, metadata } };
}
