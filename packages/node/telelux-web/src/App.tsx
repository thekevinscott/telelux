import { useFragmentTranscript } from './use-fragment-transcript';
import { Viewer } from './Viewer';

export function App() {
  const state = useFragmentTranscript();
  if (state.kind === 'transcript') {
    return <Viewer text={state.text} />;
  }
  if (state.kind === 'error') {
    return <p className="load-error" role="alert">{state.message}</p>;
  }
  if (state.kind === 'empty') {
    return <p className="empty">No transcript loaded. Open a transcript link to view one.</p>;
  }
  return null;
}
