import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalog, linkedActivities } from '../src/catalog.js';
import { releaseOne, releaseTwo, syntheticCheckpointAges } from '../fixtures/synthetic-catalogs.js';

const launch = { launch: true, expectedCheckpointAges: syntheticCheckpointAges };
const invalid = (mutate, options) => {
  const catalog = structuredClone(releaseOne);
  mutate(catalog);
  assert.throws(() => validateCatalog(catalog, options), /./);
};

test('DM-002/003: validate two synthetic releases; withdrawal can leave checkpoints empty', () => {
  assert.doesNotThrow(() => validateCatalog(releaseOne, launch));
  assert.doesNotThrow(() => validateCatalog(releaseTwo));
  assert.throws(() => validateCatalog(releaseTwo, launch), /checkpoint.*activity/i);
});

test('DM-A04: shared activities retain independent editorial order', () => {
  assert.deepEqual(linkedActivities(releaseOne, 'milestone-6').map(item => item.id), ['activity-shared', 'activity-other']);
  assert.deepEqual(linkedActivities(releaseOne, 'milestone-6-other').map(item => item.id), ['activity-other', 'activity-shared']);
  assert.deepEqual(linkedActivities(releaseTwo, 'milestone-2'), []);
});

test('DM-A04: removing final direct link fails even when skill overlaps', () => {
  invalid(c => { c.links = c.links.filter(link => link.activityId !== 'activity-shared'); });
});

test('DM-003: reject dangling typed references, duplicate IDs, links and positions', () => {
  for (const mutate of [
    c => { c.links[0].activityId = 'missing'; },
    c => { c.milestones[0].checkpointId = 'source-fiction'; },
    c => { c.activities[0].sourceIds = ['missing']; },
    c => { c.activities[0].skillIds = ['missing']; },
    c => { c.activities[0].externalResourceIds = ['missing']; },
    c => { c.categories.push({ ...c.categories[0] }); },
    c => { c.links.push({ ...c.links[0], position: 9 }); },
    c => { c.links.find(link => link.milestoneId === 'milestone-6' && link.activityId === 'activity-other').position = 1; },
  ]) invalid(mutate);
});

test('DM-003: validate range and checkpoint suitability against every link', () => {
  for (const mutate of [
    c => { c.activities[0].suitability.maxMonths = 5; },
    c => { c.activities[1].suitability.checkpointIds = ['checkpoint-4']; },
    c => { c.activities[1].suitability.checkpointIds = ['missing']; },
    c => { c.activities[0].suitability.minMonths = -1; },
    c => { c.activities[0].suitability.maxMonths = 1.5; },
    c => { c.activities[0].suitability.checkpointIds = ['checkpoint-2']; },
  ]) invalid(mutate);
});

test('DM-002: reject malformed required records and missing review/source metadata', () => {
  for (const mutate of [
    c => { c.schemaVersion = 99; }, c => { c.id = ''; }, c => { c.publishedAt = 'yesterday'; },
    c => { c.checkpoints[1].ageMonths = 2; }, c => { c.checkpoints[0].ageMonths = 2.5; },
    c => { delete c.sources[0].referenceDate; }, c => { c.sources[0].originalUrl = 'javascript:bad'; },
    c => { c.activities[0].instructions = []; }, c => { c.activities[0].reviewDate = '2025-02-30'; },
    c => { c.activities[0].sourceIds = []; }, c => { c.activities[0].revision = 0; },
    c => { delete c.milestones[0].sourceStatement; }, c => { delete c.links[0].reviewDate; },
    c => { delete c.activities[0].safetyWarnings; }, c => { c.retired = [{ id: 'x', type: 'activity', label: '', disposition: 'withdrawn' }]; },
    c => { c.retired = [{ id: 'activity-shared', type: 'activity', label: 'Old', disposition: 'withdrawn' }]; },
  ]) invalid(mutate);
  for (const value of [null, [], {}]) assert.throws(() => validateCatalog(value));
});

test('DM-003: launch checks use an explicit approved checkpoint inventory', () => {
  assert.throws(() => validateCatalog(releaseOne, { launch: true }), /inventory/i);
  assert.throws(() => validateCatalog(releaseOne, { launch: true, expectedCheckpointAges: [2, 4, 6, 60, 99] }), /inventory/i);
});
