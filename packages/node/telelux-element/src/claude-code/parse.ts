import { MAX_RECORDS } from '../limits';
import { splitJsonl } from '../split-jsonl';
import type { ChatMessage, ParseResult } from '../transcript';
import { continuesAssistant } from './continues-assistant';
import { lineMessages } from './line-messages';
import { mergeAssistant } from './merge-assistant';
import { isRecord } from './records';
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
      const pair: [ChatMessage | undefined, ChatMessage] = [messages.at(-1), message];
      if (continuesAssistant(pair)) {
        messages[messages.length - 1] = mergeAssistant(...pair);
      } else {
        messages.push(message);
      }
    }
  }
  const header = transcriptHeader(lines.map((line) => line.record).filter(isRecord));
  const metadata = { ...header.metadata, records: lines.length, usage: usageTotals(messages) };
  return { ok: true, transcript: { ...header, messages, metadata } };
}
