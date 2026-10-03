import type { Annotation } from './annotations';
import { resolveAnchor } from './resolve-anchor';
import type { ChatMessage } from './transcript';

export interface AnchoredAnnotation {
  annotation: Annotation;
  start: number;
  end: number;
}

export interface UnanchoredAnnotation {
  annotation: Annotation;
  reason: string;
}

export interface ResolvedAnnotations {
  anchored: AnchoredAnnotation[];
  unanchored: UnanchoredAnnotation[];
}

export function resolveAnnotations(messages: ChatMessage[], annotations: Annotation[]): ResolvedAnnotations {
  const resolved: ResolvedAnnotations = { anchored: [], unanchored: [] };
  for (const annotation of annotations) {
    const start = resolveAnchor(messages, annotation.target.start);
    const end = annotation.target.end === undefined ? start : resolveAnchor(messages, annotation.target.end);
    if (start === undefined) {
      resolved.unanchored.push({ annotation, reason: 'The start anchor matches no message.' });
    } else if (end === undefined) {
      resolved.unanchored.push({ annotation, reason: 'The end anchor matches no message.' });
    } else if (end < start) {
      resolved.unanchored.push({ annotation, reason: 'The end anchor comes before the start anchor.' });
    } else {
      resolved.anchored.push({ annotation, start, end });
    }
  }
  return resolved;
}
