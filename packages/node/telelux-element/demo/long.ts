import '../src/index.ts';
import type { ChatMessage, TeleluxTranscript } from '../src/index.ts';

const roles = ['user', 'assistant', 'tool', 'system'] as const;

const messages: ChatMessage[] = Array.from({ length: 500 }, (_, index) => ({
  role: roles[index % roles.length],
  content: `Message ${index}`,
}));

const el = document.querySelector<TeleluxTranscript>('telelux-transcript');
if (el) {
  el.transcript = { id: 'long', metadata: {}, messages };
}
