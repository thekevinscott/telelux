import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'telelux-transcript': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { format?: string; theme?: string };
    }
  }
}
