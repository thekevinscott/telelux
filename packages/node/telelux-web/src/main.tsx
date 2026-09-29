import 'telelux-element';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Viewer } from './Viewer';

const PLACEHOLDER = '{"type":"user","message":{"role":"user","content":"Hello"}}';

const root = document.getElementById('root');
if (!root) {throw new Error('No #root element in viewer.html');}

createRoot(root).render(
  <StrictMode>
    <Viewer text={PLACEHOLDER} />
  </StrictMode>,
);
