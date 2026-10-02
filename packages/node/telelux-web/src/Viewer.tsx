import { useContext } from 'react';

import { ThemeContext } from './theme-context';

export interface ViewerProps {
  text: string;
}

export function Viewer({ text }: ViewerProps) {
  const theme = useContext(ThemeContext);
  return <telelux-transcript theme={theme === 'dark' ? 'dark' : 'light'}>{text}</telelux-transcript>;
}
