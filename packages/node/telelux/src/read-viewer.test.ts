import { describe, expect, it } from 'vitest';
import { readViewer } from './read-viewer';

describe('readViewer', () => {
  it('reads the built single-file viewer', () => expect(readViewer()).toContain('<script type="application/x-ndjson" id="transcript"></script>'));
});
