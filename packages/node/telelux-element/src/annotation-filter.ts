import { type AnnotationStatus, annotationStatus, sourceName } from './annotation-labels';
import type { Annotation } from './annotations';

export interface AnnotationFilter {
  label?: string;
  source?: string;
  status?: AnnotationStatus;
}

export function matchesFilter(annotation: Annotation, { label, source, status }: AnnotationFilter): boolean {
  return (
    (label === undefined || annotation.label === label) &&
    (source === undefined || sourceName(annotation.source) === source) &&
    (status === undefined || annotationStatus(annotation) === status)
  );
}
