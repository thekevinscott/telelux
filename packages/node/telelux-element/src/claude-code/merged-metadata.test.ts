import { describe, expect, it } from 'vitest';

import { mergedMetadata } from './merged-metadata';

const assistant = (metadata?: Record<string, string | string[]>) => ({ role: 'assistant' as const, content: [], ...(metadata === undefined ? {} : { metadata }) });

describe('mergedMetadata', () => {
  it('starts the merged uuid list with the next record uuid', () => {
    expect(mergedMetadata(assistant({ uuid: 'a', type: 'assistant' }), assistant({ uuid: 'b' }))).toEqual({
      metadata: { uuid: 'a', type: 'assistant', mergedUuids: ['b'] },
    });
  });

  it('appends to a merged uuid list already there', () => {
    expect(mergedMetadata(assistant({ uuid: 'a', mergedUuids: ['b'] }), assistant({ uuid: 'c' }))).toEqual({ metadata: { uuid: 'a', mergedUuids: ['b', 'c'] } });
  });

  it('starts over when the merged uuids are not a list', () => {
    expect(mergedMetadata(assistant({ uuid: 'a', mergedUuids: 'x' }), assistant({ uuid: 'c' }))).toEqual({ metadata: { uuid: 'a', mergedUuids: ['c'] } });
  });

  it('works when the previous message has no metadata', () => {
    expect(mergedMetadata(assistant(), assistant({ uuid: 'b' }))).toEqual({ metadata: { mergedUuids: ['b'] } });
  });

  it('changes nothing when the next record has no uuid', () => {
    expect(mergedMetadata(assistant({ uuid: 'a' }), assistant({}))).toEqual({});
    expect(mergedMetadata(assistant({ uuid: 'a' }), assistant())).toEqual({});
  });
});
