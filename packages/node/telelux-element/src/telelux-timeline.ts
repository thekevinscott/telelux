import { css, html, LitElement, nothing, type PropertyValues } from 'lit';

import { annotationStatus } from './annotation-labels';
import { type AnnotationSidecar, parseAnnotations } from './annotations';
import { resolveAnnotations, type ResolvedAnnotations } from './resolve-annotations';
import { theme } from './theme';
import { tickStep } from './tick-step';
import { timelineLanes } from './timeline-lanes';
import type { ChatMessage } from './transcript';

const LANE_PX = 24;
const MAX_ZOOM = 16;

export class TeleluxTimeline extends LitElement {
  static override properties = {
    messages: { attribute: false },
    annotations: { attribute: false },
    theme: { type: String, reflect: true },
    zoom: { state: true },
  };

  static override styles = [theme, css`
    :host {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--_muted-foreground);
    }

    .heading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
      margin-bottom: 4px;
    }

    .title {
      font-weight: 600;
      color: var(--_foreground);
    }

    button {
      padding: 1px 6px;
      border: 1px solid var(--_border);
      border-radius: var(--_radius-sm);
      background: var(--_background);
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    button:disabled {
      cursor: default;
      opacity: 0.5;
    }

    .zoom-level {
      min-width: 2.5em;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .scroller {
      overflow-x: auto;
      padding-bottom: 4px;
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      background: var(--_secondary);
    }

    .track {
      position: relative;
      min-height: 24px;
    }

    .event {
      --status: var(--_highlight);
      position: absolute;
      box-sizing: border-box;
      min-width: 6px;
      height: 20px;
      margin-top: 2px;
      padding: 0 4px;
      overflow: hidden;
      border: 1px solid var(--status);
      border-left-width: 3px;
      background: var(--_background);
      color: var(--_foreground);
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .event[data-status='confirmed'] {
      --status: var(--_destructive);
    }

    .event[data-status='rejected'] {
      --status: var(--_muted-foreground);
    }

    .event:focus-visible {
      outline: 2px solid var(--_highlight);
      outline-offset: 1px;
    }

    .ticks {
      position: relative;
      height: 14px;
      border-top: 1px solid var(--_border);
    }

    .tick {
      position: absolute;
      top: 0;
      padding-left: 2px;
      border-left: 1px solid var(--_border);
      font-variant-numeric: tabular-nums;
    }

    .unplaced {
      margin-top: 4px;
    }

    .unplaced summary {
      cursor: pointer;
    }

    .error {
      margin: 0;
      color: var(--_destructive);
      white-space: pre-wrap;
    }
  `];

  declare messages: ChatMessage[] | undefined;
  declare annotations: AnnotationSidecar | null | undefined;
  declare theme: string | undefined;
  private declare zoom: number;

  #sidecar: AnnotationSidecar | undefined;
  #error: string | undefined;
  #resolved: ResolvedAnnotations | undefined;

  constructor() {
    super();
    this.zoom = 1;
  }

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('annotations')) {
      const parsed = this.annotations == null ? undefined : parseAnnotations(this.annotations);
      this.#sidecar = parsed?.ok === true ? parsed.annotations : undefined;
      this.#error = parsed?.ok === false ? parsed.error : undefined;
    }
    if (changed.has('annotations') || changed.has('messages')) {
      this.#resolved = resolveAnnotations(this.messages ?? [], this.#sidecar?.annotations ?? []);
    }
  }

  override render() {
    if (this.#error !== undefined) {
      return html`<pre class="error" role="alert">Invalid annotations:\n${this.#error}</pre>`;
    }
    if (this.#sidecar === undefined) {
      return nothing;
    }
    const { anchored, unanchored } = this.#resolved as ResolvedAnnotations;
    const count = (this.messages ?? []).length;
    const lanes = timelineLanes(anchored);
    const step = tickStep(count, this.zoom);
    const ticks = Array.from({ length: Math.ceil(count / step) }, (_, position) => position * step);
    const percent = (blocks: number) => `${(blocks / count) * 100}%`;
    return html`<section class="timeline" part="timeline" aria-label="Timeline">
      <div class="heading">
        <span class="title">Timeline (${anchored.length} ${anchored.length === 1 ? 'event' : 'events'})</span>
        <button class="zoom-out" type="button" aria-label="Zoom out" ?disabled=${this.zoom === 1} @click=${() => (this.zoom /= 2)}>−</button>
        <span class="zoom-level">${this.zoom}×</span>
        <button class="zoom-in" type="button" aria-label="Zoom in" ?disabled=${this.zoom === MAX_ZOOM} @click=${() => (this.zoom *= 2)}>+</button>
      </div>
      <div class="scroller">
        <div class="track" style="width: ${this.zoom * 100}%; height: ${Math.max(...lanes, 0) * LANE_PX + LANE_PX}px">
          ${anchored.map(({ annotation, start, end }, position) => {
            const name = annotation.summary ?? annotation.label;
            const blocks = end > start ? `blocks ${start}–${end}` : `block ${start}`;
            const title = `${annotation.label}${annotation.summary === undefined ? '' : `: ${annotation.summary}`} (${blocks})`;
            return html`<button class="event" type="button" data-status=${annotationStatus(annotation)} style="left: ${percent(start)}; width: ${percent(end - start + 1)}; top: ${lanes[position] * LANE_PX}px;" title=${title} aria-label="${name}, ${blocks}" @click=${() => this.#jump(start, end)}>${name}</button>`;
          })}
        </div>
        <div class="ticks" style="width: ${this.zoom * 100}%">${ticks.map((tick) => html`<span class="tick" style="left: ${percent(tick)};">${tick}</span>`)}</div>
      </div>
      ${unanchored.length === 0
        ? nothing
        : html`<details class="unplaced"><summary>Not placed (${unanchored.length})</summary><ul>${unanchored.map(({ annotation, reason }) => html`<li>${annotation.label}: ${reason}</li>`)}</ul></details>`}
    </section>`;
  }

  #jump(index: number, end: number) {
    this.dispatchEvent(new CustomEvent('telelux-jump', { detail: { index, end } }));
  }
}

customElements.define('telelux-timeline', TeleluxTimeline);
