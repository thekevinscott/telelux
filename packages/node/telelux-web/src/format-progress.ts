function mib(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function formatProgress(received: number, total: number | undefined): string {
  return total === undefined ? `${mib(received)} MiB` : `${mib(received)} of ${mib(total)} MiB`;
}
