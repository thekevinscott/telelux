import { Lexer } from 'marked';

export interface TextSegment {
  code: boolean;
  text: string;
}

export function textSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  for (const token of Lexer.lex(text)) {
    const fenced = token.type === 'code' && token.codeBlockStyle !== 'indented';
    const last = segments.at(-1);
    if (fenced) {
      segments.push({ code: true, text: token.text });
    } else if (last !== undefined && !last.code) {
      last.text += token.raw;
    } else {
      segments.push({ code: false, text: token.raw });
    }
  }
  return segments;
}
