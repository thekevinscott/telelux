import { decodePayload } from './decode-payload';
import { fetchTranscript } from './fetch-transcript';
import { parseFragment } from './parse-fragment';

export type LoadState =
  | { kind: 'pending' }
  | { kind: 'empty' }
  | { kind: 'loading'; url: string; received: number; total: number | undefined }
  | { kind: 'transcript'; text: string }
  | { kind: 'error'; message: string; retry: boolean };

export type LoadContext = {
  signal: AbortSignal;
  cache: Map<string, string>;
  onProgress: (state: LoadState) => void;
};

export async function loadFragment(hash: string, { signal, cache, onProgress }: LoadContext): Promise<LoadState> {
  const fragment = parseFragment(hash);
  switch (fragment.kind) {
    case 'none':
      return { kind: 'empty' };
    case 'malformed':
      return { kind: 'error', message: 'This link is not a transcript link. Transcript links end in #v=1&data=…', retry: false };
    case 'unsupported-version':
      return {
        kind: 'error',
        message: `This link uses format version "${fragment.version}", which this viewer cannot read. It reads version 1.`,
        retry: false,
      };
    case 'url': {
      const { url } = fragment;
      const cached = cache.get(url);
      if (cached !== undefined) {
        return { kind: 'transcript', text: cached };
      }
      onProgress({ kind: 'loading', url, received: 0, total: undefined });
      const fetched = await fetchTranscript(url, {
        signal,
        onProgress: (received, total) => onProgress({ kind: 'loading', url, received, total }),
      });
      if (!fetched.ok) {
        return { kind: 'error', message: fetched.error, retry: true };
      }
      cache.set(url, fetched.text);
      return { kind: 'transcript', text: fetched.text };
    }
    case 'payload': {
      const decoded = await decodePayload(fragment.data);
      return decoded.ok ? { kind: 'transcript', text: decoded.text } : { kind: 'error', message: decoded.error, retry: false };
    }
  }
}
