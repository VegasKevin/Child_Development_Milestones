import assert from 'node:assert/strict';
import test from 'node:test';
import { selectChecklist } from '../src/checklist-selection.js';

// Fictional published catalog subset, deliberately out of order.
// These labels and records are test data, not CDC content.
const publishedChecklists = Object.freeze([
  { id: 'fictional-60', ageMonths: 60, title: 'Fictional five-year checklist' },
  { id: 'fictional-4', ageMonths: 4, title: 'Fictional four-month checklist' },
  { id: 'fictional-2', ageMonths: 2, title: 'Fictional two-month checklist' },
  { id: 'fictional-6', ageMonths: 6, title: 'Fictional six-month checklist' },
].map(Object.freeze));

test('DM-A01: one month shows coverage and a labeled optional two-month preview', () => {
  const result = selectChecklist(1, publishedChecklists);
  assert.equal(result.status, 'below-coverage');
  assert.equal(result.checklist, null);
  assert.match(result.message, /coverage.*2 months/i);
  assert.equal(result.preview.checklist.id, 'fictional-2');
  assert.match(result.preview.label, /2.month.*preview/i);
});

test('DM-A01: six and seven months select the six-month checklist', () => {
  for (const age of [6, 7]) {
    const result = selectChecklist(age, publishedChecklists);
    assert.equal(result.status, 'selected');
    assert.equal(result.checklist.id, 'fictional-6');
    assert.equal(result.preview, null);
  }
});

test('DM-004: choose the greatest published checkpoint at or below the exact age', () => {
  for (const [age, expectedId] of [[2, 'fictional-2'], [3, 'fictional-2'],
    [4, 'fictional-4'], [5, 'fictional-4'], [59, 'fictional-6'],
    [60, 'fictional-60'], [71, 'fictional-60']]) {
    assert.equal(selectChecklist(age, publishedChecklists).checklist.id, expectedId);
  }
});

test('DM-004: zero months is below coverage; previews do not select a checklist', () => {
  const result = selectChecklist(0, publishedChecklists);
  assert.equal(result.status, 'below-coverage');
  assert.equal(result.checklist, null);
  assert.equal(result.preview.checklist.ageMonths, 2);
});

test('DM-004: 72 months and older are outside coverage', () => {
  for (const age of [72, 73, 120]) {
    const result = selectChecklist(age, publishedChecklists);
    assert.equal(result.status, 'outside-coverage');
    assert.equal(result.checklist, null);
    assert.equal(result.preview, null);
  }
});

test('DM-004: reject ages that are not nonnegative integer month counts', () => {
  for (const age of [-1, 1.5, NaN, Infinity, '6', null, undefined]) {
    assert.throws(() => selectChecklist(age, publishedChecklists), RangeError);
  }
});

test('an empty published catalog produces no selection or invented preview', () => {
  assert.equal(selectChecklist(6, []).status, 'unavailable');
  assert.equal(selectChecklist(6, []).checklist, null);
  assert.equal(selectChecklist(1, []).preview, null);
});
