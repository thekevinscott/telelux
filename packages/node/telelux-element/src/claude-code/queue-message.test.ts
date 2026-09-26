import { describe, expect, it } from 'vitest';

import { queueMessage } from './queue-message';

describe('queueMessage', () => {
  it('maps an enqueue to a user message carrying the prompt', () => {
    expect(queueMessage({ type: 'queue-operation', operation: 'enqueue', content: 'do it', timestamp: 't1' })).toEqual({
      role: 'user',
      content: 'do it',
      metadata: { type: 'queue-operation', timestamp: 't1', operation: 'enqueue' },
    });
  });

  it('maps any other operation to a system marker', () => {
    expect(queueMessage({ type: 'queue-operation', operation: 'dequeue' })).toEqual({
      role: 'system',
      content: 'queue dequeue',
      metadata: { type: 'queue-operation', operation: 'dequeue' },
    });
  });

  it('treats a missing prompt as empty', () => {
    expect(queueMessage({ type: 'queue-operation', operation: 'enqueue' }).content).toBe('');
  });
});
