import { createServer } from 'node:http';
import type { Server } from 'node:http';

export interface ServeOptions {
  host?: string;
  port?: number;
}

export async function serveViewer(page: () => string, options: ServeOptions = {}): Promise<Server> {
  const server = createServer((request, response) => {
    const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
    if (request.url !== '/') {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      response.end('Not Found');
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', allow: 'GET, HEAD' });
      response.end('Method Not Allowed');
      return;
    }
    try {
      const body = Buffer.from(page(), 'utf8');
      response.writeHead(200, { ...headers, 'content-length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      response.end('Internal Server Error');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 8000, options.host ?? '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
}
