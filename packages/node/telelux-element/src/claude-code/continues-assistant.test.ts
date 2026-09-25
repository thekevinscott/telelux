import { describe, expect, it } from 'vitest';

import { continuesAssistant } from './continues-assistant';
import type { ChatMessage } from '../transcript';

const assistant = (messageId?: string): ChatMessage => ({
  role: 'assistant',
  content: '',
  metadata: messageId === undefined ? {} : { messageId },
});

const user: ChatMessage = { role: 'user', content: '', metadata: { messageId: 'm1' } };

describe('continuesAssistant', () => {
  it('is true for two assistant messages sharing a message id', () => {
    expect(continuesAssistant([assistant('m1'), assistant('m1')])).toBe(true);
  });

  it.each([
    ['no previous message', undefined, assistant('m1')],
    ['a previous message that is not assistant', user, assistant('m1')],
    ['a next message that is not assistant', assistant('m1'), user],
    ['different message ids', assistant('m1'), assistant('m2')],
    ['no message id on either side', assistant(), assistant()],
    ['no metadata on the previous message', { role: 'assistant', content: '' } as ChatMessage, assistant('m1')],
    ['no metadata on the next message', assistant('m1'), { role: 'assistant', content: '' } as ChatMessage],
  ])('is false with %s', (_label, previous, next) => {
    expect(continuesAssistant([previous, next])).toBe(false);
  });
});
