import { useFragmentTranscript } from './use-fragment-transcript';
import { Viewer } from './Viewer';

export function App() {
  const state = useFragmentTranscript();
  switch (state.kind) {
    case 'pending':
      return null;
    case 'empty':
      return <p className="empty">No transcript loaded. Open a transcript link to view one.</p>;
    case 'error':
      return <p className="load-error" role="alert">{state.message}</p>;
    case 'transcript':
      return <Viewer text={state.text} />;
  }
}
