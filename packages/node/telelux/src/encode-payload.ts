import { deflateRaw } from 'pako';

export function encodePayload(text: string): string {
  const data = Buffer.from(text, 'utf8');
  const header = Buffer.from('1f8b08000000000002ff', 'hex');
  const body = Buffer.from(deflateRaw(data, { level: 9 }));
  const trailer = Buffer.alloc(8);
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  trailer.writeUInt32LE((crc ^ 0xffffffff) >>> 0, 0);
  trailer.writeUInt32LE(data.length >>> 0, 4);
  return Buffer.concat([header, body, trailer]).toString('base64url');
}
