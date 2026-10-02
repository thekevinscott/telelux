import type { Annotation, AnnotationSidecar } from './annotations';

export interface ResolutionChange {
  state: 'confirmed' | 'rejected' | undefined;
  by?: string;
  note?: string;
  at: string;
}

export function resolveAnnotation(sidecar: AnnotationSidecar, id: string, { state, by, note, at }: ResolutionChange): AnnotationSidecar {
  const update = (annotation: Annotation): Annotation => {
    const rest = { ...annotation };
    delete rest.resolution;
    if (state === undefined) {
      return rest;
    }
    const resolution = { state, ...(by?.trim() ? { by: by.trim() } : {}), ...(note?.trim() ? { note: note.trim() } : {}), at };
    return { ...rest, resolution };
  };
  return { ...sidecar, annotations: sidecar.annotations.map((annotation) => (annotation.id === id ? update(annotation) : annotation)) };
}
