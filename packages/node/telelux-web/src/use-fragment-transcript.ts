import { useEffect, useRef, useState } from 'react';

import { type LoadState, loadFragment } from './load-fragment';

type Controls = { cancel: () => void; retry: () => void };

export type FragmentTranscript = { state: LoadState } & Controls;

export function useFragmentTranscript(): FragmentTranscript {
  const [state, setState] = useState<LoadState>({ kind: 'pending' });
  const cache = useRef(new Map<string, string>());
  const controls = useRef<Controls>(null);
  useEffect(() => {
    let latest = {};
    let controller = new AbortController();
    const load = () => {
      controller.abort();
      const request = {};
      latest = request;
      controller = new AbortController();
      const show = (next: LoadState) => {
        if (request === latest) {
          setState(next);
        }
      };
      void loadFragment(window.location.hash, { signal: controller.signal, cache: cache.current, onProgress: show }).then(show);
    };
    controls.current = { cancel: () => controller.abort(), retry: load };
    load();
    window.addEventListener('hashchange', load);
    return () => {
      latest = {};
      controller.abort();
      window.removeEventListener('hashchange', load);
    };
  }, []);
  return { state, cancel: () => controls.current?.cancel(), retry: () => controls.current?.retry() };
}
