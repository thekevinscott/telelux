import type { ToolCall } from './transcript';

export function toolCallArguments(args: ToolCall['arguments']): string {
  return Object.entries(args ?? {})
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(', ');
}
