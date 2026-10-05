#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { Telelux } from '../dist/index.js';

const usage = 'Usage: telelux [OPTIONS] [TRANSCRIPT]\n\nServe TRANSCRIPT in the viewer, or export it with --out or --url.\nWithout TRANSCRIPT, serve the empty viewer.\n\nOptions:\n  --out PATH         Write the viewer to a new HTML file\n  --url              Print a compressed telelux.dev link\n  --annotations PATH Bake an annotations JSON file\n  --no-browser       Do not open the viewer in a browser\n  --host HOST        Interface to serve on\n  --port PORT        Port to serve on\n  --help             Show this help';

const usageError = (message) => {
  process.stderr.write(`${usage}\n\nError: ${message}\n`);
  process.exitCode = 2;
};

let args;
try {
  args = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: true,
    options: {
      out: { type: 'string' },
      url: { type: 'boolean' },
      annotations: { type: 'string' },
      'no-browser': { type: 'boolean' },
      host: { type: 'string' },
      port: { type: 'string' },
      help: { type: 'boolean' },
    },
  });
} catch (error) {
  usageError(error.message);
}

if (args) {
  const { values, positionals } = args;
  const transcript = positionals[0];
  if (values.help) {
    process.stdout.write(`${usage}\n`);
  } else if (positionals.length > 1) {
    usageError('Too many arguments');
  } else if (values.out !== undefined && values.url) {
    usageError("--out and --url can't be used together");
  } else if (values.out !== undefined && transcript === undefined) {
    usageError('--out needs a TRANSCRIPT to export');
  } else if (values.url && transcript === undefined) {
    usageError('--url needs a TRANSCRIPT to export');
  } else if (values.annotations !== undefined && transcript === undefined) {
    usageError('--annotations needs a TRANSCRIPT to annotate');
  } else if (values.annotations !== undefined && values.url) {
    usageError("--url can't carry --annotations; bake them in with --out, or serve the viewer");
  } else if (values.port !== undefined && (!/^\d+$/.test(values.port) || Number(values.port) > 65535)) {
    usageError('--port must be an integer from 0 to 65535');
  } else {
    try {
      const viewer = new Telelux(transcript ?? null, values.annotations ?? null);
      if (values.out !== undefined) {
        viewer.write(values.out);
        process.stdout.write(`${values.out}\n`);
      } else if (values.url) {
        process.stdout.write(`${viewer.url}\n`);
      } else {
        const host = values.host ?? '127.0.0.1';
        const port = values.port === undefined ? 8000 : Number(values.port);
        const server = await viewer.serve({ host, port });
        const address = server.address();
        const listeningPort = typeof address === 'string' || address === null ? port : address.port;
        process.stderr.write(`Serving on http://${host}:${listeningPort}/\n`);
        if (!values['no-browser']) {
          const url = `http://${host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host}:${listeningPort}/`;
          const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
          const browser = spawn(command, process.platform === 'win32' ? ['/c', 'start', '', url] : [url], { detached: true, stdio: 'ignore' });
          browser.on('error', () => {});
          browser.unref();
        }
      }
    } catch (error) {
      const message = error?.code === 'ENOENT' ? `${error.path}: No such file or directory` : error?.code === 'EEXIST' ? `${error.path}: File exists` : error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${message}\n`);
      process.exitCode = 1;
    }
  }
}
