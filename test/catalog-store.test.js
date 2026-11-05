import assert from 'node:assert/strict';
import test from 'node:test';
import { createCatalogStore } from '../src/catalog-store.js';
import { browseChecklists } from '../src/age-browsing.js';
import { releaseOne, releaseTwo } from '../fixtures/synthetic-catalogs.js';

const favorite = { childId: 'child-a', type: 'activity', contentId: 'activity-shared', label: 'Saved fictional label' };
const nextRelease = () => ({ ...structuredClone(releaseOne), id: 'synthetic-revised', publishedAt: '2026-01-03T12:00:00Z' });

test('DM-006: stable typed references resolve current revisions without retargeting', () => {
  const store = createCatalogStore(releaseOne);
  const entry = store.createPracticeEntry({ childId: 'child-a' }, 'activity-shared', { id: 'entry-a', practiceDate: '2025-11-15' });
  const next = nextRelease();
  next.activities[0].revision = 2;
  next.activities[0].title = 'Revised fictional title';
  store.apply(next);
  const resolved = store.resolve(favorite);
  assert.equal(resolved.status, 'active');
  assert.equal(resolved.id, favorite.contentId);
  assert.equal(resolved.content.revision, 2);
  assert.equal(resolved.label, 'Revised fictional title');
  assert.equal(store.resolve({ type: 'activity', contentId: entry.activityId, label: entry.activityTitle }).content.revision, 2);
  assert.equal(entry.activityRevision, 1);
  assert.equal(entry.activityTitle, 'Fictional shared activity');
  assert.equal(store.resolve({ type: 'milestone', contentId: favorite.contentId, label: 'Missing milestone' }).status, 'unavailable');
  assert.equal(store.resolve({ type: 'milestone', contentId: 'milestone-6', label: 'Saved behavior' }).status, 'active');
});

test('DM-A08: outside-coverage browsing keeps existing local history accessible', () => {
  const store = createCatalogStore(releaseOne);
  const entry = store.createPracticeEntry({ childId: 'child-a' }, 'activity-shared', { id: 'old-entry', practiceDate: '2025-11-15', notes: 'Saved history.' });
  const view = browseChecklists({ profile: { id: 'child-a', birth: { year: 2020, month: 1, day: 31 } }, today: '2026-01-31' }, releaseOne.checkpoints);
  assert.equal(view.status, 'outside-coverage');
  assert.equal(entry.notes, 'Saved history.');
  assert.equal(store.resolve({ type: 'activity', contentId: entry.activityId, label: entry.activityTitle }).status, 'active');
});

test('DM-A03: corrected age practice draft stays associated with selected child', () => {
  const store = createCatalogStore(releaseOne);
  const profile = { id: 'child-a', birth: { year: 2025, month: 5 } };
  const view = browseChecklists({ profile, today: '2025-11-15', temporaryAgeMonths: 6 }, releaseOne.checkpoints);
  const entry = store.createPracticeEntry(view, 'activity-shared', { id: 'entry-a', practiceDate: '2025-11-15', notes: 'Fictional saved note.' });
  assert.equal(entry.childId, profile.id);
  assert.equal(entry.activityId, 'activity-shared');
  assert.equal(entry.activityRevision, 1);
  assert.equal(entry.activityTitle, 'Fictional shared activity');
  assert.equal(Object.hasOwn(entry, 'temporaryAgeMonths'), false);
  assert.equal(Object.hasOwn(profile, 'temporaryAgeMonths'), false);
  assert.throws(() => store.createPracticeEntry({ childId: null }, 'activity-shared', { id: 'entry-b', practiceDate: '2025-11-15' }), /child/i);
});

test('DM-006: applying withdrawal hides cached instructions/links and preserves local records', () => {
  const store = createCatalogStore(releaseOne);
  const entry = store.createPracticeEntry({ childId: 'child-a' }, 'activity-shared', { id: 'entry-a', practiceDate: '2025-11-15', notes: 'Keep this note.' });
  const localRecords = { favorites: [favorite], history: [entry] };
  const before = structuredClone(localRecords);
  const cached = store.resolve(favorite);
  assert.ok(cached.content.instructions.length);
  store.apply(releaseTwo);
  const resolved = store.resolve({ ...favorite, cachedContent: cached.content });
  assert.equal(resolved.status, 'withdrawn');
  assert.equal(resolved.label, 'Fictional shared activity');
  assert.equal(resolved.content, null);
  assert.deepEqual(store.activitiesForMilestone('milestone-2'), []);
  assert.deepEqual(store.activitiesForMilestone('milestone-6').map(item => item.id), ['activity-other']);
  assert.throws(() => store.createPracticeEntry({ childId: 'child-a' }, favorite.contentId, { id: 'new', practiceDate: '2026-01-02' }), /active/i);
  assert.deepEqual(localRecords, before);
});

test('DM-006: invalid or interrupted update leaves the previous release active', () => {
  const store = createCatalogStore(releaseOne);
  const broken = structuredClone(releaseTwo);
  broken.links[0].activityId = 'missing';
  assert.throws(() => store.apply(broken));
  assert.equal(store.releaseId, releaseOne.id);
  assert.equal(store.resolve(favorite).status, 'active');
  const interrupted = { ...releaseTwo, notSerializable: () => {} };
  assert.throws(() => store.apply(interrupted));
  assert.equal(store.releaseId, releaseOne.id);
});

test('DM-006: identity and revision transition rules reject silent replacement', () => {
  for (const mutate of [
    c => { c.activities[0].title = 'Changed without revision'; },
    c => { c.activities[0].instructions = ['Different instructions.']; c.activities[0].revision = 2; },
    c => { c.milestones[0].checkpointId = 'checkpoint-4'; c.milestones[0].revision = 2; },
    c => { c.milestones[0].sourceStatement = 'Different behavior.'; c.milestones[0].revision = 2; },
    c => { c.activities = c.activities.filter(a => a.id !== 'activity-shared'); c.links = c.links.filter(l => l.activityId !== 'activity-shared'); },
    c => { c.checkpoints[0].ageMonths = 3; },
  ]) {
    const store = createCatalogStore(releaseOne), next = nextRelease();
    mutate(next);
    assert.throws(() => store.apply(next));
    assert.equal(store.releaseId, releaseOne.id);
  }
});

test('DM-006: retired identities remain tombstones and cannot be reused', () => {
  const store = createCatalogStore(releaseTwo);
  assert.throws(() => store.apply(nextRelease()), /retired|withdrawn/i);
  const missing = { ...structuredClone(releaseTwo), id: 'missing-tombstone', publishedAt: '2026-01-03T12:00:00Z', retired: [] };
  assert.throws(() => store.apply(missing), /retired|tombstone/i);
  const retired = structuredClone(releaseTwo);
  retired.id = 'non-safety-retirement';
  retired.retired[0].disposition = 'retired';
  assert.equal(createCatalogStore(retired).resolve(favorite).status, 'retired');
});

test('DM-006: a material replacement uses a new identity and retires the old one', () => {
  const store = createCatalogStore(releaseOne), next = nextRelease();
  next.activities[0] = { ...next.activities[0], id: 'new-activity', instructions: ['New fictional instructions.'] };
  next.links = next.links.map(link => ({ ...link, activityId: link.activityId === 'activity-shared' ? 'new-activity' : link.activityId }));
  next.retired.push({ id: 'activity-shared', type: 'activity', label: 'Old fictional activity', disposition: 'retired' });
  store.apply(next);
  assert.equal(store.resolve(favorite).status, 'retired');
  assert.equal(store.resolve(favorite).content, null);
  assert.equal(store.resolve({ ...favorite, contentId: 'new-activity' }).status, 'active');
});

test('DM-006: explicitly reviewed same-meaning prose edits preserve identity', () => {
  const store = createCatalogStore(releaseOne), next = nextRelease();
  next.activities[0].instructions = ['Fictional instruction for software testing only. (Copy edited.)'];
  next.activities[0].revision = 2;
  store.apply(next, { equivalentEdits: [{ type: 'activity', id: 'activity-shared' }] });
  assert.equal(store.resolve(favorite).content.revision, 2);
  assert.equal(store.resolve(favorite).id, favorite.contentId);
});

test('unknown IDs use saved labels and never resolve by a matching title', () => {
  const store = createCatalogStore(releaseOne);
  const missing = { type: 'activity', contentId: 'missing', label: releaseOne.activities[0].title };
  assert.deepEqual(store.resolve(missing), { type: 'activity', id: 'missing', label: missing.label, status: 'unavailable', content: null });
});

test('release identity is immutable and callers cannot mutate active snapshots', () => {
  const input = structuredClone(releaseOne), store = createCatalogStore(input);
  input.activities[0].title = 'Tampered input';
  store.resolve(favorite).content.instructions.length = 0;
  store.activitiesForMilestone('milestone-6')[0].title = 'Tampered output';
  assert.equal(store.resolve(favorite).label, releaseOne.activities[0].title);
  assert.ok(store.resolve(favorite).content.instructions.length);
  assert.doesNotThrow(() => store.apply(releaseOne));
  const conflicting = structuredClone(releaseOne);
  conflicting.summary = 'Changed same release';
  assert.throws(() => store.apply(conflicting), /release.*immutable/i);
  store.apply(releaseTwo);
  assert.throws(() => store.apply(releaseOne), /older|rollback/i);
  assert.equal(store.releaseId, releaseTwo.id);
});
