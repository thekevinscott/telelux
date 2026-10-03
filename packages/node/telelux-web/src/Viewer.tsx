import { useContext, useMemo, useState } from 'react';
import type { AnnotationSidecar } from 'telelux-element/parse';

import { AnnotationsFile } from './AnnotationsFile';
import type { AnnotationsFileResult } from './prepare-annotations-file';
import { readSidecar } from './read-sidecar';
import { ThemeContext } from './theme-context';

export interface ViewerProps {
  text: string;
  annotations?: string;
}

type Shown = { text: string; annotations?: AnnotationSidecar; error?: string };

export function Viewer({ text, annotations }: ViewerProps) {
  const theme = useContext(ThemeContext);
  const baked = useMemo(() => (annotations === undefined ? undefined : readSidecar(annotations, 'The baked-in annotations slot')), [annotations]);
  const [picked, setPicked] = useState<Shown>();
  const shown: Shown =
    picked?.text === text ? picked : baked?.ok === false ? { text, error: baked.error } : { text, annotations: baked?.annotations };
  const open = (result: AnnotationsFileResult) => {
    if (result.kind === 'annotations') {
      setPicked({ text, annotations: result.annotations });
    } else if (result.kind === 'error') {
      setPicked({ ...shown, error: result.message });
    }
  };
  return (
    <>
      <AnnotationsFile onOpen={open} error={shown.error} />
      <telelux-transcript theme={theme === 'dark' ? 'dark' : 'light'} annotations={shown.annotations}>
        {text}
      </telelux-transcript>
    </>
  );
}
