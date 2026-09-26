import type { Content } from '../transcript';
import { type Block, str } from './records';

export function contentItems(blocks: Block[]): Content[] {
  return blocks.map((block): Content => {
    switch (block.type) {
      case 'text':
        return { type: 'text', text: str(block.text) };
      case 'thinking':
        return {
          type: 'reasoning',
          reasoning: str(block.thinking),
          ...(typeof block.signature === 'string' ? { signature: block.signature } : {}),
        };
      case 'redacted_thinking':
        return { type: 'reasoning', reasoning: '', redacted: true };
      case 'image':
        return { type: 'image' };
      default:
        return { type: 'text', text: `[${String(block.type)}]` };
    }
  });
}
