import { decodePayload } from './decode-payload';
import { parseFragment } from './parse-fragment';

export type LoadState =
  | { kind: 'pending' }
  | { kind: 'empty' }
  | { kind: 'transcript'; text: string }
  | { kind: 'error'; message: string };

export async function loadFragment(hash: string): Promise<LoadState> {
  const fragment = parseFragment(hash);
  switch (fragment.kind) {
    case 'none':
      return { kind: 'empty' };
    case 'malformed':
      return { kind: 'error', message: 'This link is not a transcript link. Transcript links end in #v=1&data=…' };
    case 'unsupported-version':
      return {
        kind: 'error',
        message: `This link uses format version "${fragment.version}", which this viewer cannot read. It reads version 1.`,
      };
    case 'url':
      return { kind: 'error', message: 'This viewer cannot open hosted transcript links yet.' };
    case 'payload': {
      const decoded = await decodePayload(fragment.data);
      return decoded.ok ? { kind: 'transcript', text: decoded.text } : { kind: 'error', message: decoded.error };
    }
  }
}
