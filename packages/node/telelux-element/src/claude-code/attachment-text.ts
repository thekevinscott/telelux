import { deltaLine } from './delta-line';
import { type Block, str } from './records';

export function attachmentText(attachment: Block): string {
  const subtype = str(attachment.type) || 'attachment';
  switch (subtype) {
    case 'deferred_tools_delta':
      return deltaLine(subtype, attachment, 'addedNames', 'removedNames');
    case 'agent_listing_delta':
      return deltaLine(subtype, attachment, 'addedTypes', 'removedTypes');
    case 'skill_listing':
      return `skill_listing (${typeof attachment.skillCount === 'number' ? attachment.skillCount : 0} skills)`;
    case 'total_tokens_reminder':
      return str(attachment.text).replace(/<\/?total_tokens>/g, '').trim() || subtype;
    case 'edited_text_file':
      return [subtype, str(attachment.filename)].join(' ').trim();
    case 'queued_command':
      return str(attachment.commandMode) === '' ? subtype : `${subtype} (${str(attachment.commandMode)})`;
    case 'read_truncation_notice':
      return str(attachment.banner) || subtype;
    case 'date_change':
      return str(attachment.newDate) === '' ? subtype : `${subtype} → ${str(attachment.newDate)}`;
    default:
      return subtype;
  }
}
