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

    it('reserves an empty controls slot on the right', async () => {
      const el = await mount({ role: 'user', content: 'x' });
      expect(find(el, '.header .controls')?.textContent).toBe('');
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

    it('omits the footer when it has nothing to show', async () => {
      const el = await mount({ role: 'tool', content: 'ok' });
      expect(find(el, '.tool-info')).toBeNull();
    });

    it('renders no footer for a non-tool message carrying tool fields', async () => {
      const el = await mount({ role: 'user', content: 'x', tool_call_id: 'call_1' });
      expect(find(el, '.tool-info')).toBeNull();
    });
  });
});
