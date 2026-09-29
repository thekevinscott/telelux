import { afterEach, describe, expect, it } from 'vitest';

import { TeleluxMessage } from './telelux-message';
import type { ChatMessage } from './transcript';

async function mount(message: ChatMessage | undefined, index = 0): Promise<TeleluxMessage> {
  const el = document.createElement('telelux-message') as TeleluxMessage;
  el.message = message;
  el.index = index;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function find(el: TeleluxMessage, selector: string): Element | null {
  return el.shadowRoot?.querySelector(selector) ?? null;
}

function all(el: TeleluxMessage, selector: string): string[] {
  return [...(el.shadowRoot?.querySelectorAll(selector) ?? [])].map((node) => node.textContent ?? '');
}


describe('TeleluxMessage', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers the telelux-message tag', () => {
    expect(customElements.get('telelux-message')).toBe(TeleluxMessage);
  });

  it('renders nothing without a message', async () => {
    const el = await mount(undefined);
    expect(find(el, '.block')).toBeNull();
  });

  it('ignores message and index attributes', async () => {
    const el = await mount({ role: 'user', content: 'x' }, 3);
    el.setAttribute('message', '{"role":"system","content":"y"}');
    el.setAttribute('index', '9');
    await el.updateComplete;
    expect(el.message).toEqual({ role: 'user', content: 'x' });
    expect(el.index).toBe(3);
  });

  describe('header', () => {
    it.each([
      ['user', 'User'],
      ['assistant', 'Assistant'],
      ['system', 'System'],
      ['tool', 'Tool'],
    ] as const)('labels a %s block with its index and role', async (role, label) => {
      const el = await mount({ role, content: 'x' }, 7);
      expect(find(el, '.header .label')?.textContent).toBe(`Block 7 | ${label}`);
      expect(find(el, '.block')?.getAttribute('data-role')).toBe(role);
    });


    it('re-renders when the message changes', async () => {
      const el = await mount({ role: 'user', content: 'before' });
      el.message = { role: 'system', content: 'after' };
      await el.updateComplete;
      expect(find(el, '.label')?.textContent).toBe('Block 0 | System');
      expect(find(el, '.content')?.textContent).toBe('after');
    });
  });

  describe('main content', () => {
    it('renders string content verbatim, whitespace included', async () => {
      const el = await mount({ role: 'user', content: '  line one\n\tline two  ' });
      expect(find(el, '.content')?.textContent).toBe('  line one\n\tline two  ');
    });

    it('joins the text items of a Content[]', async () => {
      const el = await mount({ role: 'assistant', content: [{ type: 'text', text: 'one' }, { type: 'text', text: 'two' }] });
      expect(find(el, '.content')?.textContent).toBe('one\ntwo');
    });

    it('omits the content box when there is no text', async () => {
      const el = await mount({ role: 'assistant', content: '' });
      expect(find(el, '.content')).toBeNull();
    });

    it('renders transcript text as text, never as markup', async () => {
      const el = await mount({ role: 'user', content: '<b>bold</b><img src=x onerror=alert(1)>' });
      expect(find(el, '.content b')).toBeNull();
      expect(find(el, 'img')).toBeNull();
      expect(find(el, '.content')?.textContent).toBe('<b>bold</b><img src=x onerror=alert(1)>');
    });
  });

  describe('reasoning', () => {
    const message: ChatMessage = {
      role: 'assistant',
      content: [
        { type: 'reasoning', reasoning: 'think first' },
        { type: 'text', text: 'answer' },
        { type: 'reasoning', reasoning: 'think again' },
      ],
    };

    it('renders the first reasoning item above the main content', async () => {
      const el = await mount(message);
      expect(all(el, '.reasoning-text')).toEqual(['think first']);
      const reasoning = find(el, '.reasoning');
      const content = find(el, '.content');
      expect(reasoning?.compareDocumentPosition(content as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('labels it Reasoning and starts expanded', async () => {
      const el = await mount(message);
      expect(find(el, '.reasoning summary')?.textContent).toBe('Reasoning');
      expect(find(el, '.reasoning')?.hasAttribute('open')).toBe(true);
    });

    it('collapses when the summary is clicked', async () => {
      const el = await mount(message);
      (find(el, '.reasoning summary') as HTMLElement).click();
      expect(find(el, '.reasoning')?.hasAttribute('open')).toBe(false);
    });

    it('is absent for string content', async () => {
      const el = await mount({ role: 'assistant', content: 'plain' });
      expect(find(el, '.reasoning')).toBeNull();
    });

    it('is absent when the reasoning text is empty', async () => {
      const el = await mount({ role: 'assistant', content: [{ type: 'reasoning', reasoning: '' }, { type: 'text', text: 'a' }] });
      expect(find(el, '.reasoning')).toBeNull();
    });
  });

  describe('images', () => {
    it('renders a placeholder label per image item, after the text', async () => {
      const el = await mount({
        role: 'user',
        content: [{ type: 'text', text: 'look' }, { type: 'image' }, { type: 'image' }],
      });
      expect(all(el, '.image')).toEqual(['[image]', '[image]']);
      expect(find(el, '.content')?.compareDocumentPosition(find(el, '.image') as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('renders no placeholder for string content', async () => {
      const el = await mount({ role: 'user', content: 'image' });
      expect(find(el, '.image')).toBeNull();
    });
  });

  describe('assistant tool calls', () => {
    it('renders a view verbatim, fences included', async () => {
      const el = await mount({
        role: 'assistant',
        content: '',
        tool_calls: [{
          id: 'call_1',
          function: 'bash',
          type: 'function',
          arguments: { cmd: 'ls' },
          view: { content: '```bash\nls -la\n```', format: 'markdown' },
        }],
      });
      expect(all(el, '.tool-call .id')).toEqual(['Tool Call ID: call_1']);
      expect(find(el, '.tool-call .code')?.textContent).toBe('```bash\nls -la\n```');
      expect(find(el, '.tool-call .function')).toBeNull();
    });

    it('renders function(k=v) with the name in bold when there is no view', async () => {
      const el = await mount({
        role: 'assistant',
        content: 'checking',
        tool_calls: [{ id: 'call_2', function: 'clock', type: 'function', arguments: { zone: 'Asia/Tokyo', n: 2 } }],
      });
      expect(find(el, '.tool-call .function')?.tagName).toBe('B');
      expect(find(el, '.tool-call .function')?.textContent).toBe('clock');
      expect(find(el, '.tool-call .code')?.textContent).toBe('clock(zone=Asia/Tokyo, n=2)');
    });

    it('renders one box per call, after the content', async () => {
      const el = await mount({
        role: 'assistant',
        content: 'two calls',
        tool_calls: [
          { id: 'a', function: 'f', type: 'function' },
          { id: 'b', function: 'g', type: 'function' },
        ],
      });
      expect(all(el, '.tool-call .code')).toEqual(['f()', 'g()']);
      expect(find(el, '.content')?.compareDocumentPosition(find(el, '.tool-call') as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('renders no tool call box for an assistant without calls', async () => {
      const el = await mount({ role: 'assistant', content: 'done' });
      expect(find(el, '.tool-call')).toBeNull();
    });

    it('ignores tool_calls on a non-assistant message', async () => {
      const stray = { role: 'user', content: 'x', tool_calls: [{ id: 'a', function: 'f', type: 'function' }] };
      const el = await mount(stray as unknown as ChatMessage);
      expect(find(el, '.tool-call')).toBeNull();
    });
  });

  describe('tool messages', () => {
    it('renders the call id and function under the content', async () => {
      const el = await mount({ role: 'tool', content: 'ok', tool_call_id: 'call_1', function: 'clock' });
      expect(all(el, '.tool-info span')).toEqual(['Tool Call ID: call_1', 'Function: clock']);
      expect(find(el, '.tool-info .error')).toBeNull();
      expect(find(el, '.content')?.compareDocumentPosition(find(el, '.tool-info') as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('renders the error message in the destructive colour', async () => {
      const el = await mount({
        role: 'tool',
        content: 'boom',
        tool_call_id: 'call_3',
        error: { type: 'tool_error', message: 'exit 1' },
      });
      expect(all(el, '.tool-info span')).toEqual(['Tool Call ID: call_3']);
      expect(find(el, '.tool-info .error')?.textContent).toBe('Error: exit 1');
    });

    it('renders only the function when there is no call id', async () => {
      const el = await mount({ role: 'tool', content: 'ok', function: 'clock' });
      expect(all(el, '.tool-info span')).toEqual(['Function: clock']);
    });

    it('renders only the call id when there is no function', async () => {
      const el = await mount({ role: 'tool', content: 'ok', tool_call_id: 'call_4' });
      expect(all(el, '.tool-info span')).toEqual(['Tool Call ID: call_4']);
    });

    it('renders an error with no call id or function', async () => {
      const el = await mount({ role: 'tool', content: 'boom', error: { type: 'tool_error', message: 'lost' } });
      expect(all(el, '.tool-info span')).toEqual([]);
      expect(find(el, '.tool-info .error')?.textContent).toBe('Error: lost');
    });

    it('omits the footer when it has nothing to show', async () => {
      const el = await mount({ role: 'tool', content: 'ok' });
      expect(find(el, '.tool-info')).toBeNull();
    });

    it('renders no footer for a non-tool message carrying tool fields', async () => {
      const el = await mount({ role: 'user', content: 'x', tool_call_id: 'call_1' });
      expect(find(el, '.tool-info')).toBeNull();
    });
  });

  describe('controls', () => {
    const withMetadata: ChatMessage = { role: 'user', content: '{"a":1}', metadata: { type: 'user', uuid: 'u1' } };

    function click(el: TeleluxMessage, selector: string): Promise<boolean> {
      (find(el, selector) as HTMLButtonElement).click();
      return el.updateComplete;
    }

    it('are real buttons, in DOM order: text mode, metadata, raw', async () => {
      const el = await mount(withMetadata);
      const buttons = [...(el.shadowRoot?.querySelectorAll('.controls > *') ?? [])];
      expect(buttons.map((button) => [button.tagName, button.getAttribute('type'), button.className]))
        .toEqual([['BUTTON', 'button', 'text-mode'], ['BUTTON', 'button', 'metadata-toggle'], ['BUTTON', 'button', 'raw-toggle']]);
    });

    describe('text mode', () => {
      it('shows raw text by default', async () => {
        const el = await mount(withMetadata);
        expect(find(el, '.text-mode')?.textContent).toBe('文A');
        expect(find(el, '.text-mode')?.getAttribute('aria-pressed')).toBe('false');
        expect(find(el, '.content')?.textContent).toBe('{"a":1}');
      });

      it('indents JSON content when switched on, and restores it when switched off', async () => {
        const el = await mount(withMetadata);
        await click(el, '.text-mode');
        expect(find(el, '.text-mode')?.getAttribute('aria-pressed')).toBe('true');
        expect(find(el, '.content')?.textContent).toBe('{\n  "a": 1\n}');
        expect(find(el, '.content')?.classList.contains('formatted')).toBe(false);
        await click(el, '.text-mode');
        expect(find(el, '.content')?.textContent).toBe('{"a":1}');
      });

      it('renders other text as wrapped prose with fenced blocks in monospace', async () => {
        const el = await mount({ role: 'assistant', content: 'Run:\n\n```bash\nls <dir>\n```\ndone' });
        await click(el, '.text-mode');
        expect(find(el, '.content')?.classList.contains('formatted')).toBe(true);
        expect(all(el, '.content .fence')).toEqual(['ls <dir>']);
        expect(find(el, '.content')?.textContent).toBe('Run:\n\nls <dir>done');
        expect(find(el, '.content dir')).toBeNull();
      });

      it('is per block', async () => {
        const first = await mount(withMetadata, 0);
        const second = await mount(withMetadata, 1);
        await click(first, '.text-mode');
        expect(find(second, '.content')?.textContent).toBe('{"a":1}');
      });
    });

    describe('metadata', () => {
      it('is hidden when the message has no metadata', async () => {
        const el = await mount({ role: 'user', content: 'x' });
        expect(find(el, '.metadata-toggle')).toBeNull();
      });

      it('is hidden when every metadata value is undefined', async () => {
        const el = await mount({ role: 'user', content: 'x', metadata: { gone: undefined } });
        expect(find(el, '.metadata-toggle')).toBeNull();
      });

      it('opens a popover with the message metadata and closes on a second click', async () => {
        const el = await mount(withMetadata, 4);
        expect(find(el, '.metadata-toggle')?.textContent).toBe('Metadata');
        expect(find(el, '.metadata-toggle svg')).not.toBeNull();
        expect(find(el, '.popover')).toBeNull();
        await click(el, '.metadata-toggle');
        expect(find(el, '.metadata-toggle')?.getAttribute('aria-expanded')).toBe('true');
        const popover = find(el, '.popover');
        expect(popover?.getAttribute('role')).toBe('dialog');
        expect(popover?.getAttribute('aria-label')).toBe('Message Metadata - Block 4');
        expect(find(el, '.popover-title')?.textContent).toBe('Message Metadata - Block 4');
        expect((find(el, '.popover telelux-metadata') as HTMLElement & { metadata: unknown }).metadata).toEqual(withMetadata.metadata);
        await click(el, '.metadata-toggle');
        expect(find(el, '.popover')).toBeNull();
        expect(find(el, '.metadata-toggle')?.getAttribute('aria-expanded')).toBe('false');
      });

      it('closes on Escape and returns focus to its button', async () => {
        const el = await mount(withMetadata);
        await click(el, '.metadata-toggle');
        find(el, '.popover')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
        await el.updateComplete;
        expect(find(el, '.popover')).toBeNull();
        expect(el.shadowRoot?.activeElement).toBe(find(el, '.metadata-toggle'));
      });

      it('ignores other keys and Escape while closed', async () => {
        const el = await mount(withMetadata);
        const button = find(el, '.metadata-toggle') as HTMLButtonElement;
        find(el, '.block')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await el.updateComplete;
        expect(el.shadowRoot?.activeElement).toBeNull();
        await click(el, '.metadata-toggle');
        find(el, '.popover')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await el.updateComplete;
        expect(find(el, '.popover')).not.toBeNull();
        expect(button.getAttribute('aria-expanded')).toBe('true');
      });

      it('closing one block\'s popover leaves another open', async () => {
        const first = await mount(withMetadata, 0);
        const second = await mount(withMetadata, 1);
        await click(first, '.metadata-toggle');
        await click(second, '.metadata-toggle');
        await click(first, '.metadata-toggle');
        expect(find(first, '.popover')).toBeNull();
        expect(find(second, '.popover')).not.toBeNull();
      });
    });

    describe('raw', () => {
      it('reveals the message as received, indented, at the end of the block', async () => {
        const message: ChatMessage = {
          role: 'assistant',
          content: [{ type: 'text', text: '<b>x</b>' }],
          tool_calls: [{ id: 'c', function: 'f', type: 'function' }],
        };
        const el = await mount(message);
        expect(find(el, '.raw')).toBeNull();
        await click(el, '.raw-toggle');
        expect(find(el, '.raw-toggle')?.getAttribute('aria-pressed')).toBe('true');
        expect(find(el, '.raw')?.textContent).toBe(JSON.stringify(message, null, 2));
        expect(find(el, '.block')?.lastElementChild).toBe(find(el, '.raw'));
        await click(el, '.raw-toggle');
        expect(find(el, '.raw')).toBeNull();
        expect(find(el, '.raw-toggle')?.getAttribute('aria-pressed')).toBe('false');
      });
    });

    it('resets when the block is given a different message', async () => {
      const el = await mount(withMetadata);
      await click(el, '.text-mode');
      await click(el, '.metadata-toggle');
      await click(el, '.raw-toggle');
      el.message = { ...withMetadata };
      await el.updateComplete;
      expect(find(el, '.text-mode')?.getAttribute('aria-pressed')).toBe('false');
      expect(find(el, '.popover')).toBeNull();
      expect(find(el, '.raw')).toBeNull();
    });

    it('ignores attributes named after its internal state', async () => {
      const el = await mount(withMetadata);
      el.setAttribute('formatted', 'x');
      el.setAttribute('metadataopen', 'x');
      el.setAttribute('rawopen', 'x');
      el.index = 2;
      await el.updateComplete;
      expect(find(el, '.text-mode')?.getAttribute('aria-pressed')).toBe('false');
      expect(find(el, '.popover')).toBeNull();
      expect(find(el, '.raw')).toBeNull();
    });

        it('keeps its state when an unrelated property changes', async () => {
      const el = await mount(withMetadata);
      await click(el, '.raw-toggle');
      el.index = 9;
      await el.updateComplete;
      expect(find(el, '.raw')).not.toBeNull();
    });
  });

  describe('theming', () => {
    const withMetadata: ChatMessage = { role: 'user', content: 'x', metadata: { a: 1 } };

    it('reflects the theme property to the attribute the stylesheet selects on', async () => {
      const el = await mount(withMetadata);
      el.theme = 'dark';
      await el.updateComplete;
      expect(el.getAttribute('theme')).toBe('dark');
    });

    it('reads the theme attribute', async () => {
      const el = await mount(withMetadata);
      el.setAttribute('theme', 'light');
      expect(el.theme).toBe('light');
    });

    it('passes its theme to the metadata popover', async () => {
      const el = await mount(withMetadata);
      el.theme = 'dark';
      (find(el, '.metadata-toggle') as HTMLElement).click();
      await el.updateComplete;
      expect(find(el, 'telelux-metadata')?.getAttribute('theme')).toBe('dark');
    });

    it('leaves the popover unthemed when it has no theme', async () => {
      const el = await mount(withMetadata);
      (find(el, '.metadata-toggle') as HTMLElement).click();
      await el.updateComplete;
      expect(find(el, 'telelux-metadata')?.hasAttribute('theme')).toBe(false);
    });

    it('names its regions as parts', async () => {
      const el = await mount({
        role: 'assistant',
        content: [{ type: 'reasoning', reasoning: 'think' }, { type: 'text', text: 'say' }],
        tool_calls: [{ id: 'c', function: 'f', type: 'function' }],
      });
      expect(find(el, '.block')?.getAttribute('part')).toBe('block block-assistant');
      expect(find(el, '.header')?.getAttribute('part')).toBe('header');
      expect(find(el, '.content')?.getAttribute('part')).toBe('content');
      expect(find(el, '.reasoning')?.getAttribute('part')).toBe('reasoning');
      expect(find(el, '.tool-call')?.getAttribute('part')).toBe('tool-call');
    });

    it('keeps the content part in the formatted views', async () => {
      const prose = await mount({ role: 'user', content: 'plain words' });
      (find(prose, '.text-mode') as HTMLElement).click();
      await prose.updateComplete;
      expect(find(prose, '.content.formatted')?.getAttribute('part')).toBe('content');
      const json = await mount({ role: 'user', content: '{"a":1}' });
      (find(json, '.text-mode') as HTMLElement).click();
      await json.updateComplete;
      expect(find(json, '.content')?.textContent).toBe('{\n  "a": 1\n}');
      expect(find(json, '.content')?.getAttribute('part')).toBe('content');
    });
  });
});
