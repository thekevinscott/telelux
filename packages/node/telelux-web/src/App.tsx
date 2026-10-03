import { formatProgress } from './format-progress';
import { useFragmentTranscript } from './use-fragment-transcript';
import { Viewer } from './Viewer';

export function App() {
  const { state, cancel, retry } = useFragmentTranscript();
  if (state.kind === 'transcript') {
    return <Viewer text={state.text} annotations={state.annotations} />;
  }
  if (state.kind === 'loading') {
    return (
      <p className="loading" role="status">
        Loading {state.url} ({formatProgress(state.received, state.total)})…{' '}
        <button type="button" onClick={cancel}>Cancel</button>
      </p>
    );
  }
  if (state.kind === 'error') {
    return (
      <p className="load-error" role="alert">
        {state.message}
        {state.retry && <> <button type="button" onClick={retry}>Retry</button></>}
      </p>
    );
  }
  if (state.kind === 'empty') {
    return <p className="empty">No transcript loaded. Open a transcript link to view one.</p>;
  }
  return null;
}
