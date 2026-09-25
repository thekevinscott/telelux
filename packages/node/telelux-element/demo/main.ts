import '../src/index.ts';
import type { TeleluxTranscript, Transcript } from '../src/index.ts';

const transcript: Transcript = {
  id: 'demo',
  name: 'Demo transcript',
  metadata: {},
  messages: [
    { role: 'user', content: 'What time is it in Tokyo?' },
    {
      role: 'assistant',
      content: [
        { type: 'reasoning', reasoning: 'I need the current time; a tool can give it.' },
        { type: 'text', text: 'Let me check.' },
      ],
      tool_calls: [{ id: 'call_1', function: 'clock', type: 'function', arguments: { zone: 'Asia/Tokyo' } }],
    },
    { role: 'tool', content: '2026-09-25T16:00:00+09:00', tool_call_id: 'call_1', function: 'clock' },
    { role: 'assistant', content: 'It is 4 pm in Tokyo.' },
  ],
};

const el = document.querySelector<TeleluxTranscript>('telelux-transcript');
if (el) {
  el.transcript = transcript;
}
