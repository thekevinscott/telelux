import { useRef, useState } from 'react';

import { bakeTranscript } from './bake-transcript';
import { downloadFile } from './download-file';
import { type LocalFileResult, prepareLocalFile } from './prepare-local-file';
import { standaloneName } from './standalone-name';
import { useFileDrop } from './use-file-drop';

export interface LocalFileProps {
  pristineHtml: string;
}

export function LocalFile({ pristineHtml }: LocalFileProps) {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<LocalFileResult>();
  const open = async (files: ArrayLike<File>) => {
    const next = await prepareLocalFile(files, window.location.href.split('#')[0]);
    if (next.kind === 'link') {
      window.location.hash = next.hash;
    }
    setResult(next);
  };
  useFileDrop(open);
  return (
    <div className="local-file">
      <button type="button" onClick={() => input.current?.click()}>Open a transcript file</button> or drop one anywhere on
      the page.
      <input
        ref={input}
        type="file"
        hidden
        onChange={(event) => {
          void open(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      {result?.kind === 'error' && <p className="load-error" role="alert">{result.message}</p>}
      {result?.kind === 'too-large' && (
        <p className="load-error" role="alert">
          {result.message}{' '}
          <button type="button" onClick={() => downloadFile(standaloneName(result.name), bakeTranscript(pristineHtml, result.text))}>
            Download standalone HTML
          </button>
        </p>
      )}
    </div>
  );
}
