import { describe, expect, it } from 'vitest';

import { attachmentText } from './attachment-text';

describe('attachmentText', () => {
  it.each([
    ['deferred_tools_delta', { type: 'deferred_tools_delta', addedNames: ['Bash'], removedNames: ['Read', 'Edit'] }, 'deferred_tools_delta +1 -2'],
    ['agent_listing_delta', { type: 'agent_listing_delta', addedTypes: ['a'], removedTypes: ['x', 'y'] }, 'agent_listing_delta +1 -2'],
    ['skill_listing', { type: 'skill_listing', skillCount: 13 }, 'skill_listing (13 skills)'],
    ['skill_listing without a count', { type: 'skill_listing' }, 'skill_listing (0 skills)'],
    ['total_tokens_reminder', { type: 'total_tokens_reminder', text: '<total_tokens>\n15 left\n</total_tokens>' }, '15 left'],
    ['total_tokens_reminder without text', { type: 'total_tokens_reminder' }, 'total_tokens_reminder'],
    ['edited_text_file', { type: 'edited_text_file', filename: '/a.py' }, 'edited_text_file /a.py'],
    ['edited_text_file without a name', { type: 'edited_text_file' }, 'edited_text_file'],
    ['queued_command', { type: 'queued_command', commandMode: 'task-notification' }, 'queued_command (task-notification)'],
    ['queued_command without a mode', { type: 'queued_command' }, 'queued_command'],
    ['read_truncation_notice', { type: 'read_truncation_notice', banner: '[Truncated]' }, '[Truncated]'],
    ['read_truncation_notice without a banner', { type: 'read_truncation_notice' }, 'read_truncation_notice'],
    ['date_change', { type: 'date_change', newDate: '2026-09-09' }, 'date_change → 2026-09-09'],
    ['date_change without a date', { type: 'date_change' }, 'date_change'],
    ['an unknown subtype', { type: 'environment' }, 'environment'],
    ['a missing subtype', {}, 'attachment'],
  ])('summarizes %s', (_label, attachment, expected) => {
    expect(attachmentText(attachment)).toBe(expected);
  });
});
