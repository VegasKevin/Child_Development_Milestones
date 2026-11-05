import assert from 'node:assert/strict';
import { browseChecklists } from '../src/age-browsing.js';
import { createCatalogStore } from '../src/catalog-store.js';
import { releaseOne, releaseTwo, syntheticCheckpointAges } from '../fixtures/synthetic-catalogs.js';

const store = createCatalogStore(releaseOne, { launch: true, expectedCheckpointAges: syntheticCheckpointAges });
const profile = { id: 'synthetic-child', birth: { year: 2025, month: 5 } };
const input = { profile, today: '2025-11-15' };
const approximate = browseChecklists(input, releaseOne.checkpoints);
assert.equal(approximate.checklist.ageMonths, 4);
assert.equal(approximate.preview.checklist.ageMonths, 6);
const corrected = browseChecklists({ ...input, temporaryAgeMonths: 6 }, releaseOne.checkpoints);
const entry = store.createPracticeEntry(corrected, 'activity-shared', {
  id: 'synthetic-entry', practiceDate: input.today, notes: 'Fictional history survives a withdrawal.',
});
assert.equal(entry.childId, profile.id);
const favorite = { type: 'activity', contentId: entry.activityId, label: entry.activityTitle };
assert.equal(store.resolve(favorite).status, 'active');
store.apply(releaseTwo);
assert.equal(store.resolve(favorite).status, 'withdrawn');
assert.equal(store.resolve(favorite).content, null);
assert.equal(entry.notes, 'Fictional history survives a withdrawal.');
assert.equal(store.activitiesForMilestone('milestone-2').length, 0);
console.log('Synthetic milestone check passed: age selection, catalog validation, stable references and withdrawal.');
console.log('Run npm.cmd test for DM-A01, DM-A02, DM-A03, DM-A04 and DM-A08 boundary coverage.');
