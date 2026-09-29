export function isTextEntry(target: EventTarget | undefined): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.closest('[contenteditable]:not([contenteditable="false"])') !== null);
}
