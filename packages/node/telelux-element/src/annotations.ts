import { z } from 'zod';

import { sidecarSchema } from './sidecar-schema';

export type AnnotationSidecar = z.infer<ReturnType<typeof sidecarSchema>>;
export type Annotation = AnnotationSidecar['annotations'][number];
export type Anchor = Annotation['target']['start'];

export type AnnotationsResult =
  | { ok: true; annotations: AnnotationSidecar }
  | { ok: false; error: string };

export function parseAnnotations(value: unknown): AnnotationsResult {
  const result = sidecarSchema().safeParse(value);
  if (result.success) {
    return { ok: true, annotations: value as AnnotationSidecar };
  }
  return { ok: false, error: z.prettifyError(result.error) };
}
