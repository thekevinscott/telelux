import { z } from 'zod';

export function sidecarSchema() {
  const anchor = z
    .object({
      uuid: z.string().min(1).optional(),
      tool_call_id: z.string().min(1).optional(),
      index: z.int().nonnegative().optional(),
    })
    .refine(({ uuid, tool_call_id, index }) => uuid !== undefined || tool_call_id !== undefined || index !== undefined, {
      message: 'An anchor needs a uuid, tool_call_id, or index.',
    });
  const annotation = z.object({
    id: z.string().min(1),
    target: z.object({ start: anchor, end: anchor.optional() }),
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
  return z
    .object({
      version: z.literal(1),
      transcript_id: z.string().optional(),
      annotations: z.array(annotation),
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
}
