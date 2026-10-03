import '../src/index.ts';
import type { Annotation, ChatMessage, TeleluxTranscript } from '../src/index.ts';

const roles = ['user', 'assistant', 'tool', 'system'] as const;

const messages: ChatMessage[] = Array.from({ length: 300 }, (_, index) => ({
  role: roles[index % roles.length],
  content: `Message ${index}`,
}));

const event = (id: string, start: number, end: number, summary: string): Annotation => ({
  id,
  target: { start: { index: start }, end: { index: end } },
  label: id,
  summary,
  source: { kind: 'model', name: 'summarizer' },
});

const el = document.querySelector<TeleluxTranscript>('telelux-transcript');
if (el) {
  el.transcript = { id: 'timeline-demo', metadata: {}, messages };
  el.annotations = {
    version: 1,
    transcript_id: 'timeline-demo',
    annotations: [
      event('setup', 0, 40, 'Reads the repository layout'),
      event('first-attempt', 41, 120, 'Tries a fix that fails the suite'),
      event('detour', 90, 110, 'Investigates an unrelated warning'),
      event('fix', 200, 240, 'Lands the working fix'),
      event('wrap-up', 280, 299, 'Summarizes the change'),
    ],
  };
}
