import { decodeBase64url } from './decode-base64url';
import { gunzipCapped } from './gunzip-capped';

export const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

export type DecodeResult = { ok: true; text: string } | { ok: false; error: string };

export async function decodePayload(data: string): Promise<DecodeResult> {
  const bytes = decodeBase64url(data);
  if (bytes === undefined) {
    return { ok: false, error: 'The link data is not valid base64url. The link may have been cut off or altered.' };
  }
  const inflated = await gunzipCapped(bytes, MAX_PAYLOAD_BYTES);
  if (!inflated.ok) {
    return {
      ok: false,
      error: inflated.reason === 'too-large'
        ? 'The link data decompresses to more than the 10 MiB limit.'
        : 'The link data is not valid gzip. The link may have been cut off or altered.',
    };
  }
  try {
    return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(inflated.bytes) };
  } catch {
    return { ok: false, error: 'The link data is not valid UTF-8 text.' };
  }
}
