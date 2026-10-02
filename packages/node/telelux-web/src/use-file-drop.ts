import { useEffect } from 'react';

export function useFileDrop(onDrop: (files: ArrayLike<File>) => void): void {
  useEffect(() => {
    const allow = (event: DragEvent) => event.preventDefault();
    const drop = (event: DragEvent) => {
      event.preventDefault();
      onDrop(event.dataTransfer?.files ?? []);
    };
    window.addEventListener('dragover', allow);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', allow);
      window.removeEventListener('drop', drop);
    };
  }, [onDrop]);
}
