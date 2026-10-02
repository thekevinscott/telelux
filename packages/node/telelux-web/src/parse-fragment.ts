export type Fragment =
  | { kind: 'none' }
  | { kind: 'url'; url: string }
  | { kind: 'payload'; data: string }
  | { kind: 'unsupported-version'; version: string }
  | { kind: 'malformed' };

export function parseFragment(hash: string): Fragment {
  const DATA = '&data=';
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (fragment === '') {
    return { kind: 'none' };
  }
  if (!fragment.startsWith('v=')) {
    return { kind: 'malformed' };
  }
  const versionEnd = fragment.indexOf('&');
  const version = fragment.slice(2, versionEnd === -1 ? undefined : versionEnd);
  if (version !== '1') {
    return { kind: 'unsupported-version', version };
  }
  if (fragment.slice(versionEnd, versionEnd + DATA.length) !== DATA) {
    return { kind: 'malformed' };
  }
  const data = fragment.slice(versionEnd + DATA.length);
  if (data === '') {
    return { kind: 'malformed' };
  }
  if (/^https?:\/\//.test(data)) {
    return { kind: 'url', url: data };
  }
  return { kind: 'payload', data };
}
