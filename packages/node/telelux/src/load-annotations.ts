import { loadFile } from './load-file';

export function loadAnnotations(path: string): string {
  let text: string;
  try {
    text = loadFile(path, 'annotations', '.json');
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`${path} is not UTF-8 text`, { cause: error });
    }
    throw error;
  }
  try {
    JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${String(error)}`, { cause: error });
  }
  return text;
}
