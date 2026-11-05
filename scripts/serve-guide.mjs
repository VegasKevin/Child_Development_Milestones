import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.argv[2] ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Expected a valid port.');
const files = new Map([
  ['/', ['../guide/index.html', 'text/html']],
  ['/guide.js', ['../guide/guide.js', 'text/javascript']],
  ['/guide.css', ['../guide/guide.css', 'text/css']],
  ['/profiles.js', ['../guide/profiles.js', 'text/javascript']],
  ['/backup.js', ['../guide/backup.js', 'text/javascript']],
  ['/backup-store.js', ['../guide/backup-store.js', 'text/javascript']],
  ['/src/backup.js', ['../src/backup.js', 'text/javascript']],
  ['/profile-store.js', ['../guide/profile-store.js', 'text/javascript']],
  ['/src/age-browsing.js', ['../src/age-browsing.js', 'text/javascript']],
  ['/src/child-profiles.js', ['../src/child-profiles.js', 'text/javascript']],
  ['/src/personal-records.js', ['../src/personal-records.js', 'text/javascript']],
  ['/src/checklist-selection.js', ['../src/checklist-selection.js', 'text/javascript']],
  ['/src/catalog.js', ['../src/catalog.js', 'text/javascript']],
  ['/fixtures/synthetic-catalogs.js', ['../fixtures/synthetic-catalogs.js', 'text/javascript']],
  ['/fixtures/guide-catalog.js', ['../fixtures/guide-catalog.js', 'text/javascript']],
  ['/fixtures/cdc-source-register.json', ['../fixtures/cdc-source-register.json', 'application/json']],
  ['/fixtures/cdc-milestones-draft.json', ['../fixtures/cdc-milestones-draft.json', 'application/json']],
  ['/fixtures/cdc-milestones-draft.js', ['../fixtures/cdc-milestones-draft.json', 'text/javascript', 'json-module']],
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
  if (path === '/favicon.ico') { response.writeHead(204, headers).end(); return; }
  const file = files.get(path);
  if (!file) { response.writeHead(404, headers).end('Not found'); return; }
  try {
    const contents = await readFile(new URL(file[0], import.meta.url));
    const body = file[2] === 'json-module'
      ? Buffer.concat([Buffer.from('export default '), contents, Buffer.from(';')])
      : contents;
    response.writeHead(200, { ...headers, 'content-type': `${file[1]}; charset=utf-8` });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, headers).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local guide: http://127.0.0.1:${port}`));
