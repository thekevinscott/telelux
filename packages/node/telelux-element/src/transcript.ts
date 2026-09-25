import { z } from 'zod';

const metadataPrimitive = z.union([z.string(), z.number(), z.boolean()]);
const metadataLeaf = z.union([metadataPrimitive, z.array(metadataPrimitive)]);
const metadataSchema = z.record(
  z.string(),
  z.union([metadataLeaf, z.record(z.string(), metadataLeaf), z.undefined()]),
);

const contentSchema = z.object({
  type: z.enum(['text', 'image', 'reasoning']),
  text: z.string().optional(),
  reasoning: z.string().optional(),
  signature: z.string().nullish(),
  redacted: z.boolean().optional(),
  refusal: z.string().nullish(),
});

const toolCallSchema = z.object({
  id: z.string(),
  function: z.string(),
  type: z.string(),
  arguments: z.record(z.string(), z.unknown()).optional(),
  view: z.object({ content: z.string(), format: z.string() }).optional(),
});

const messageBase = {
  content: z.union([z.string(), z.array(contentSchema)]),
  metadata: metadataSchema.optional(),
};

const chatMessageSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('system'), ...messageBase }),
  z.object({ role: z.literal('user'), ...messageBase, tool_call_id: z.string().optional() }),
  z.object({ role: z.literal('assistant'), ...messageBase, tool_calls: z.array(toolCallSchema).optional() }),
  z.object({
    role: z.literal('tool'),
    ...messageBase,
    tool_call_id: z.string().optional(),
    function: z.string().optional(),
    error: z.object({ type: z.string(), message: z.string() }).optional(),
  }),
]);

const transcriptSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  transcript_group_id: z.string().nullish(),
  created_at: z.string().nullish(),
  messages: z.array(chatMessageSchema),
  metadata: metadataSchema,
});

export type Metadata = z.infer<typeof metadataSchema>;
export type Content = z.infer<typeof contentSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type Transcript = z.infer<typeof transcriptSchema>;

export type ParseResult =
  | { ok: true; transcript: Transcript }
  | { ok: false; error: string };

export function parseTranscript(value: unknown): ParseResult {
  const result = transcriptSchema.safeParse(value);
  if (result.success) {
    return { ok: true, transcript: value as Transcript };
  }
  return { ok: false, error: z.prettifyError(result.error) };
}
