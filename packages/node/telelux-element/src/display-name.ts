export function displayName(name: string | null | undefined): string | undefined {
  return name == null || name.trim() === '' ? undefined : name;
}
