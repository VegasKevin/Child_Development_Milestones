import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../hosting/sites-candidate/worker/index.js';

test('POC-01: access entry explains the invitation boundary without catalog content', async () => {
  const response = await worker.fetch(new Request('https://candidate.invalid/'), {});
  assert.equal(response.status, 200);
  assert.match(await response.text(), /invitation/i);
});

test('POC-01: anonymous direct catalog and asset requests are denied without caching', async () => {
  for (const path of ['/catalog.json', '/assets/essential.txt']) {
    const response = await worker.fetch(new Request(`https://candidate.invalid${path}`), {});
    assert.equal(response.status, 401);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.doesNotMatch(await response.text(), /synthetic-release|fictional essential/i);
  }
});

test('POC-01: Sites-authenticated owner can fetch protected synthetic resources', async () => {
  for (const path of ['/catalog.json', '/assets/essential.txt']) {
    const response = await worker.fetch(new Request(`https://candidate.invalid${path}`, {
      headers: { 'oai-authenticated-user-id': 'synthetic-owner' },
    }), {});
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});

test('unknown routes expose no fallback catalog or source files', async () => {
  for (const path of ['/worker/index.js', '/.openai/hosting.json', '/catalog.json/extra', '/assets/../source']) {
    const response = await worker.fetch(new Request(`https://candidate.invalid${path}`), {});
    assert.equal(response.status, 404);
  }
});
