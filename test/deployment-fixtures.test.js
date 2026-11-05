import assert from 'node:assert/strict';
import test from 'node:test';
import { createCatalogStore } from '../src/catalog-store.js';
import { releaseOne, releaseTwo, syntheticCheckpointAges } from '../fixtures/synthetic-catalogs.js';

test('POC-07 preparation: release B withdraws one activity and revises the survivor', () => {
  const store = createCatalogStore(releaseOne, { launch: true, expectedCheckpointAges: syntheticCheckpointAges });
  const original = releaseOne.activities.find(item => item.id === 'activity-other');
  const changed = releaseTwo.activities.find(item => item.id === original.id);
  assert.notEqual(changed.title, original.title, 'Release B must contain an observable editorial revision.');
  assert.ok(changed.revision > original.revision, 'The revised activity must increment its revision.');
  assert.deepEqual(changed.instructions, original.instructions, 'This fixture revises copy without changing the activity procedure.');
  assert.notEqual(releaseTwo.summary, releaseOne.summary);
  const reference = { type: 'activity', contentId: original.id, label: original.title };
  const savedEntry = store.createPracticeEntry({ childId: 'synthetic-child' }, original.id, {
    id: 'synthetic-entry', practiceDate: '2026-01-01', notes: 'Fictional note retained across updates.',
  });
  const before = structuredClone(savedEntry);
  const incomplete = structuredClone(releaseTwo);
  incomplete.links[0].activityId = 'missing-download-record';
  assert.throws(() => store.apply(incomplete));
  assert.equal(store.releaseId, releaseOne.id);
  assert.equal(store.resolve(reference).content.revision, original.revision);
  store.apply(releaseTwo);
  assert.equal(store.releaseId, releaseTwo.id);
  assert.equal(store.resolve(reference).label, changed.title);
  assert.equal(store.resolve(reference).content.revision, changed.revision);
  assert.equal(store.resolve({ type: 'activity', contentId: 'activity-shared', label: 'Saved fictional title' }).status, 'withdrawn');
  assert.deepEqual(savedEntry, before);
});
