import { z } from 'zod';

const anchorSchema = z
  .object({
    uuid: z.string().min(1).optional(),
    tool_call_id: z.string().min(1).optional(),
    index: z.int().nonnegative().optional(),
  })
  .refine((anchor) => anchor.uuid !== undefined || anchor.tool_call_id !== undefined || anchor.index !== undefined, {
    message: 'An anchor needs a uuid, tool_call_id, or index.',
  });

const annotationSchema = z.object({
  id: z.string().min(1),
  target: z.object({ start: anchorSchema, end: anchorSchema.optional() }),
  label: z.string().min(1),
  summary: z.string().optional(),
  note: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.object({ kind: z.enum(['human', 'judge', 'model']), name: z.string().optional() }),
  resolution: z
    .object({
      state: z.enum(['confirmed', 'rejected']),
      by: z.string().optional(),
      note: z.string().optional(),
      at: z.string().optional(),
    })
    .optional(),
  created_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const sidecarSchema = z
  .object({
    version: z.literal(1),
    transcript_id: z.string().optional(),
    annotations: z.array(annotationSchema),
  })
  .superRefine(({ annotations }, context) => {
    const seen = new Set<string>();
    annotations.forEach(({ id }, index) => {
      if (seen.has(id)) {
        context.addIssue({ code: 'custom', path: ['annotations', index, 'id'], message: `Duplicate annotation id "${id}".` });
      }
      seen.add(id);
    });
  });

export type Anchor = z.infer<typeof anchorSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type AnnotationSidecar = z.infer<typeof sidecarSchema>;

export type AnnotationsResult =
  | { ok: true; annotations: AnnotationSidecar }
  | { ok: false; error: string };

export function parseAnnotations(value: unknown): AnnotationsResult {
  const result = sidecarSchema.safeParse(value);
  if (result.success) {
    return { ok: true, annotations: value as AnnotationSidecar };
  }
  return { ok: false, error: z.prettifyError(result.error) };
}
