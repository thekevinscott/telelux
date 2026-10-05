import { fillSlot } from './fill-slot';
import { readViewer } from './read-viewer';

export function bakeViewer(text: string, annotations: string | null): string {
  const page = fillSlot(readViewer(), '<script type="application/x-ndjson" id="transcript">', text, 'transcript');
  return fillSlot(page, '<script type="application/json" id="annotations">', annotations ?? '', 'annotations');
}
