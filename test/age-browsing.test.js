import assert from 'node:assert/strict';
import test from 'node:test';
import { browseChecklists } from '../src/age-browsing.js';

const checkpoints = [2, 4, 6, 60].map(ageMonths => ({ id: `fictional-${ageMonths}`, ageMonths }));
const profile = Object.freeze({ id: 'child-a', birth: Object.freeze({ year: 2025, month: 5 }) });

test('DM-A02: May birth month on November 15 spans five to six months', () => {
  const view = browseChecklists({ profile, today: '2025-11-15' }, checkpoints);
  assert.deepEqual(view.age, { minMonths: 5, maxMonths: 6, approximate: true });
  assert.equal(view.checklist.ageMonths, 4);
  assert.equal(view.preview.checklist.ageMonths, 6);
  assert.match(view.preview.label, /6-month.*preview/i);
});

test('DM-A03: temporary age wins without changing saved child or a fresh session', () => {
  const input = { profile, today: '2025-11-15', temporaryAgeMonths: 6 };
  const before = structuredClone(input);
  const view = browseChecklists(input, checkpoints);
  assert.equal(view.childId, 'child-a');
  assert.equal(view.checklist.ageMonths, 6);
  assert.deepEqual(view.age, { minMonths: 6, maxMonths: 6, approximate: false });
  assert.deepEqual(input, before);
  assert.equal(browseChecklists({ profile, today: input.today }, checkpoints).checklist.ageMonths, 4);
});

test('DM-A08: month-end clamp, leap years and upper boundary', () => {
  const browse = (birth, today) => browseChecklists({ profile: { id: 'child-b', birth }, today }, checkpoints);
  assert.equal(browse({ year: 2025, month: 1, day: 31 }, '2025-02-28').age.minMonths, 1);
  assert.equal(browse({ year: 2024, month: 1, day: 31 }, '2024-02-28').age.minMonths, 0);
  assert.equal(browse({ year: 2024, month: 1, day: 31 }, '2024-02-29').age.minMonths, 1);
  assert.equal(browse({ year: 2020, month: 1, day: 31 }, '2025-12-31').checklist.ageMonths, 60);
  assert.equal(browse({ year: 2020, month: 1, day: 31 }, '2026-01-31').status, 'outside-coverage');
});

test('DM-004: current birth month includes only dates through today', () => {
  const view = browseChecklists({ profile: { id: 'child-c', birth: { year: 2025, month: 11 } }, today: '2025-11-15' }, checkpoints);
  assert.deepEqual(view.age, { minMonths: 0, maxMonths: 0, approximate: true });
  assert.equal(view.status, 'below-coverage');
  assert.equal(view.preview.checklist.ageMonths, 2);
});

test('DM-004: reject impossible and future births and invalid calendar inputs', () => {
  for (const birth of [{ year: 2025, month: 2, day: 29 }, { year: 2025, month: 13 },
    { year: 2025, month: 0 }, { year: 2025, month: 11, day: 16 },
    { year: 2025, month: 12 }, { year: 2025, month: 1, day: null }]) {
    assert.throws(() => browseChecklists({ profile: { id: 'child', birth }, today: '2025-11-15' }, checkpoints), RangeError);
  }
  assert.throws(() => browseChecklists({ profile, today: '2025-02-30' }, checkpoints), RangeError);
  assert.throws(() => browseChecklists({ profile, today: '2025-11-15', temporaryAgeMonths: -1 }, checkpoints), RangeError);
});

test('temporary browsing without a profile has no selected child', () => {
  const view = browseChecklists({ temporaryAgeMonths: 7, today: '2025-11-15' }, checkpoints);
  assert.equal(view.childId, null);
  assert.equal(view.checklist.ageMonths, 6);
});
