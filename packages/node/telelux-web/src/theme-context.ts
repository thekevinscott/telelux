import { createContext } from 'react';

import type { ThemeName } from './use-theme';

export const ThemeContext = createContext<ThemeName>('paper');
