import { writeFileSync } from 'node:fs';

import { bakeViewer } from './bake-viewer';
import { buildLink } from './build-link';
import { loadAnnotations } from './load-annotations';
import { loadFile } from './load-file';

export class Telelux {
  #transcript: string | null = null;
  #contents: string | null = null;
  #annotationsPath: string | null = null;
  #annotations: string | null = null;

  constructor(transcript: string | null = null, annotations: string | null = null) {
    this.transcript = transcript;
    this.annotations = annotations;
  }

  get transcript(): string | null { return this.#transcript; }
  set transcript(path: string | null) {
    const contents = path === null ? null : loadFile(path, 'transcript', '.jsonl');
    this.#transcript = path;
    this.#contents = contents;
  }

  get annotations(): string | null { return this.#annotationsPath; }
  set annotations(path: string | null) {
    const contents = path === null ? null : loadAnnotations(path);
    this.#annotationsPath = path;
    this.#annotations = contents;
  }

  get html(): string { return bakeViewer(this.#snapshot(), this.#annotations); }

  get url(): string {
    const contents = this.#snapshot();
    if (this.#annotations !== null) {
      throw new Error("A telelux.dev link can't carry annotations; bake them into the HTML instead (html, write or serve), or set annotations to null");
    }
    return buildLink(contents);
  }

  write(path: string): void { writeFileSync(path, this.html, { encoding: 'utf8', flag: 'wx' }); }

  #snapshot(): string {
    if (this.#contents === null) { throw new Error('No transcript set'); }
    return this.#contents;
  }
}
