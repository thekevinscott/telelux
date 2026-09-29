export function prettyJson(text: string): string | undefined {
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
  } catch {}
  return undefined;
}
