import { describe, expect, it } from 'vitest';

import { recordMetadata } from './record-metadata';

describe('recordMetadata', () => {
  it('carries the record type, uuid, and timestamp', () => {
    expect(recordMetadata({ type: 'user', uuid: 'u1', timestamp: 't1', cwd: '/w' })).toEqual({
      type: 'user',
      uuid: 'u1',
      timestamp: 't1',
    });
  });

  it('carries meta and sidechain flags only when set', () => {
    expect(recordMetadata({ type: 'system', isMeta: true, isSidechain: false })).toEqual({ type: 'system', isMeta: true });
  });

  it('stringifies a missing type', () => {
    expect(recordMetadata({})).toEqual({ type: 'undefined' });
  });

  it('drops passthrough keys of the wrong type', () => {
    expect(recordMetadata({ type: 'user', uuid: 3, timestamp: null })).toEqual({ type: 'user' });
  });
});
