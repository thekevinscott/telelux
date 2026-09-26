import { describe, expect, it } from 'vitest';

import { attachmentMessage } from './attachment-message';

describe('attachmentMessage', () => {
  it('maps an attachment to a system message naming its subtype', () => {
    const record = { type: 'attachment', uuid: 'u1', attachment: { type: 'date_change', newDate: '2026-09-09' } };
    expect(attachmentMessage(record)).toEqual({
      role: 'system',
      content: 'date_change → 2026-09-09',
      metadata: { type: 'attachment', uuid: 'u1', attachment: 'date_change' },
    });
  });

  it('tolerates a missing attachment body', () => {
    expect(attachmentMessage({ type: 'attachment' })).toEqual({
      role: 'system',
      content: 'attachment',
      metadata: { type: 'attachment', attachment: '' },
    });
  });
});
