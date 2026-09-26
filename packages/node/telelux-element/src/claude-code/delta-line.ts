import type { Block } from './records';

export function deltaLine(subtype: string, attachment: Block, addedKey: string, removedKey: string): string {
  const count = (key: string) => (Array.isArray(attachment[key]) ? (attachment[key] as unknown[]).length : 0);
  const bits = [count(addedKey) > 0 ? `+${count(addedKey)}` : '', count(removedKey) > 0 ? `-${count(removedKey)}` : ''];
  return [subtype, ...bits.filter((bit) => bit !== '')].join(' ');
}
