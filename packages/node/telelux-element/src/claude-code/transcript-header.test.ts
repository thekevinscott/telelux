import { describe, expect, it } from 'vitest';

import { transcriptHeader } from './transcript-header';

describe('transcriptHeader', () => {
  it('takes the id, created_at, and session fields from the first records that carry them', () => {
    const records = [
      { type: 'queue-operation', sessionId: 's1', timestamp: 't1' },
      { type: 'user', sessionId: 's2', timestamp: 't2', cwd: '/w', version: '2.0', gitBranch: 'main' },
      { type: 'user', cwd: '/other' },
    ];
    expect(transcriptHeader(records)).toEqual({
      id: 's1',
      created_at: 't1',
      metadata: { format: 'claude-code', sessionId: 's1', cwd: '/w', version: '2.0', gitBranch: 'main' },
    });
  });

  it('prefers a custom title over an AI title for the name', () => {
    const records = [{ type: 'ai-title', aiTitle: 'auto' }, { type: 'custom-title', customTitle: 'mine' }];
    expect(transcriptHeader(records).name).toBe('mine');
  });

  it('uses the AI title when there is no custom one', () => {
    expect(transcriptHeader([{ type: 'ai-title', aiTitle: 'auto' }]).name).toBe('auto');
  });

  it('falls back to the format name as id and omits absent fields', () => {
    expect(transcriptHeader([{ type: 'user', sessionId: 3 }])).toEqual({ id: 'claude-code', metadata: { format: 'claude-code' } });
  });
});
