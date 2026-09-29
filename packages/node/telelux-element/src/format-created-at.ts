export function formatCreatedAt(value: string | null | undefined): string | undefined {
  if (value == null || value.trim() === '') {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
