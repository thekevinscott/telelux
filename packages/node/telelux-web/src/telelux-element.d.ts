import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { AnnotationSidecar } from 'telelux-element/parse';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'telelux-transcript': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { format?: string; theme?: string; annotations?: AnnotationSidecar };
    }
  }
}
