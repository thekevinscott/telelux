import type { Annotation } from './annotations';

export type AnnotationStatus = 'unresolved' | 'confirmed' | 'rejected';

export function sourceName({ kind, name }: Annotation['source']): string {
  return name === undefined ? kind : `${kind}: ${name}`;
}

export function annotationStatus({ resolution }: Annotation): AnnotationStatus {
  return resolution?.state ?? 'unresolved';
}
