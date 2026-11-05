import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.argv[2] ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Expected a valid port.');
const files = new Map([
  ['/', ['../guide/index.html', 'text/html']],
  ['/guide.js', ['../guide/guide.js', 'text/javascript']],
  ['/guide.css', ['../guide/guide.css', 'text/css']],
  ['/src/checklist-selection.js', ['../src/checklist-selection.js', 'text/javascript']],
  ['/src/catalog.js', ['../src/catalog.js', 'text/javascript']],
  ['/fixtures/synthetic-catalogs.js', ['../fixtures/synthetic-catalogs.js', 'text/javascript']],
  ['/fixtures/guide-catalog.js', ['../fixtures/guide-catalog.js', 'text/javascript']],
]);

createServer(async (request, response) => {
  const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" };
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { ...headers, allow: 'GET, HEAD' }).end();
    return;
  }
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/healthz') { response.writeHead(200, headers).end(); return; }
  const file = files.get(path);
  if (!file) { response.writeHead(404, headers).end('Not found'); return; }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { ...headers, 'content-type': `${file[1]}; charset=utf-8` });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, headers).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local guide: http://127.0.0.1:${port}`));
