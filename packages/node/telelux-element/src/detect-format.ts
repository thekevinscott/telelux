import { type Format, formats } from './formats';

export function detectFormat(text: string): Format | undefined {
  return (Object.keys(formats) as Format[]).find((name) => formats[name].sniff(text));
}
