import { useRef } from 'react';

import { type AnnotationsFileResult, prepareAnnotationsFile } from './prepare-annotations-file';

export interface AnnotationsFileProps {
  onOpen: (result: AnnotationsFileResult) => void;
  error?: string;
}

export function AnnotationsFile({ onOpen, error }: AnnotationsFileProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="annotations-file">
      <button type="button" onClick={() => input.current?.click()}>Open an annotations file</button> to review alongside this
      transcript.
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          void prepareAnnotationsFile(Array.from(event.target.files ?? [])).then(onOpen);
          event.target.value = '';
        }}
      />
      {error !== undefined && <p className="load-error annotations-error" role="alert">{error}</p>}
    </div>
  );
}
