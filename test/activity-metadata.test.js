import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalog } from '../src/catalog.js';
import { createCatalogStore } from '../src/catalog-store.js';
import { releaseOne } from '../fixtures/synthetic-catalogs.js';
import { guideCatalog } from '../fixtures/guide-catalog.js';

test('DM-002/003: malformed discovery metadata cannot replace the active catalog', () => {
  const store = createCatalogStore(releaseOne);
  for (const [field, values] of [
    ['durationMinutes', [0, -1, 2.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '5', null]],
    ['setting', ['', 'both', 'inside', null, [], {}]],
  ]) {
    for (const value of values) {
      const candidate = structuredClone(releaseOne);
      candidate.id = 'invalid-discovery-metadata';
      candidate.publishedAt = '2026-01-03T12:00:00Z';
      candidate.activities[0].revision++;
      candidate.activities[0][field] = value;
      assert.throws(() => store.apply(candidate), /duration|setting/i);
      assert.equal(store.releaseId, releaseOne.id);
      assert.deepEqual(store.resolve({ type: 'activity', contentId: 'activity-shared', label: 'Saved activity' }).content,
        releaseOne.activities[0]);
    }
  }
});

test('DM-002: optional duration and location preserve earlier catalogs', () => {
  assert.doesNotThrow(() => validateCatalog(releaseOne));
  for (const setting of ['indoor', 'outdoor', 'either']) {
    const catalog = structuredClone(releaseOne);
    Object.assign(catalog.activities[0], { durationMinutes: 1, setting });
    assert.doesNotThrow(() => validateCatalog(catalog));
  }
});

test('DM-006: guide metadata is a separate valid release with incremented activity revisions', () => {
  const store = createCatalogStore(releaseOne);
  assert.doesNotThrow(() => store.apply(guideCatalog));
  assert.equal(store.releaseId, guideCatalog.id);
  assert.notEqual(guideCatalog.id, releaseOne.id);
  assert.equal(Object.hasOwn(releaseOne.activities[0], 'durationMinutes'), false);
  assert.equal(Object.hasOwn(releaseOne.activities[1], 'setting'), false);
});
