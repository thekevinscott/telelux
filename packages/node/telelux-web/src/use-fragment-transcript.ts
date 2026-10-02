import { useEffect, useState } from 'react';

import { type LoadState, loadFragment } from './load-fragment';

export function useFragmentTranscript(): LoadState {
  const [state, setState] = useState<LoadState>({ kind: 'pending' });
  useEffect(() => {
    let latest = {};
    const load = () => {
      const request = {};
      latest = request;
      void loadFragment(window.location.hash).then((result) => {
        if (request === latest) {
          setState(result);
        }
      });
    };
    load();
    window.addEventListener('hashchange', load);
    return () => {
      latest = {};
      window.removeEventListener('hashchange', load);
    };
  }, []);
  return state;
}
