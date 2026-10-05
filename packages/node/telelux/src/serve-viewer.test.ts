import { describe, expect, it } from 'vitest';
import { serveViewer } from './serve-viewer';

describe('serveViewer', () => {
  it('serves GET and HEAD and reports unsupported requests', async () => {
    const server = await serveViewer(() => '<h1>Hello</h1>', { port: 0 });
    try {
      const address = server.address();
      if (typeof address === 'string' || address === null) { throw new Error('No TCP address'); }
      const origin = `http://127.0.0.1:${address.port}`;
      const get = await fetch(origin);
      expect(get.status).toBe(200);
      expect(get.headers.get('cache-control')).toBe('no-store');
      expect(get.headers.get('content-type')).toBe('text/html; charset=utf-8');
      expect(await get.text()).toBe('<h1>Hello</h1>');
      const head = await fetch(origin, { method: 'HEAD' });
      expect(head.status).toBe(200);
      expect(head.headers.get('content-length')).toBe('14');
      expect(await head.text()).toBe('');
      const missing = await fetch(`${origin}/missing`);
      expect(missing.status).toBe(404);
      const post = await fetch(origin, { method: 'POST' });
      expect(post.status).toBe(405);
      expect(post.headers.get('allow')).toBe('GET, HEAD');
    } finally { server.closeAllConnections(); server.close(); }
  });
  it('reports a page failure without crashing the server', async () => {
    const server = await serveViewer(() => { throw new Error('broken'); }, { port: 0 });
    try {
      const address = server.address();
      if (typeof address === 'string' || address === null) { throw new Error('No TCP address'); }
      const response = await fetch(`http://127.0.0.1:${address.port}/`);
      expect(response.status).toBe(500);
    } finally { server.closeAllConnections(); server.close(); }
  });
  it('rejects when the port is already in use', async () => {
    const server = await serveViewer(() => 'first', { port: 0 });
    try {
      const address = server.address();
      if (typeof address === 'string' || address === null) { throw new Error('No TCP address'); }
      await expect(serveViewer(() => 'second', { port: address.port })).rejects.toThrow();
    } finally { server.close(); }
  });
});
