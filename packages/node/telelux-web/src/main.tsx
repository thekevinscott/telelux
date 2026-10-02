import 'telelux-element';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { LocalFile } from './LocalFile';
import { ThemeShell } from './ThemeShell';
import { UrlEntry } from './UrlEntry';

const root = document.getElementById('root');
if (!root) {throw new Error('No #root element in viewer.html');}

const pristineHtml = `<!doctype html>\n${document.documentElement.outerHTML}`;

createRoot(root).render(
  <StrictMode>
    <ThemeShell>
      <UrlEntry />
      <LocalFile pristineHtml={pristineHtml} />
      <App />
    </ThemeShell>
  </StrictMode>,
);
