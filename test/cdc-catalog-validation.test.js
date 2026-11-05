import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { validateCdcCatalog } from '../src/cdc-catalog-validation.js';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const sourceRegister = readJson('../fixtures/cdc-source-register.json');
const milestoneDraft = readJson('../fixtures/cdc-milestones-draft.json');
const report = (register = sourceRegister, draft = milestoneDraft) => validateCdcCatalog(register, draft);

test('CP-002: the current CDC draft passes source, checkpoint and content-integrity checks', () => {
  const result = report();
  assert.deepEqual(result.issues, []);
  assert.equal(result.checkpointCount, 12);
  assert.equal(result.milestoneCount, 159);
});

test('CP-002: reject a missing official checkpoint and unlinked source URL', () => {
  const register = structuredClone(sourceRegister);
  register.checkpoints.pop();
  const draft = structuredClone(milestoneDraft);
  draft.checkpoints[0].sourceUrl = 'https://www.cdc.gov/act-early/digital-online-checklist/4-months.html';
  const codes = report(register, draft).issues.map(issue => issue.code);
  assert.ok(codes.includes('checkpoint-age-inventory'));
  assert.ok(codes.includes('checkpoint-source-mismatch'));
});

test('CP-002: reject a source URL changed together with the draft reference', () => {
  const register = structuredClone(sourceRegister);
  const draft = structuredClone(milestoneDraft);
  register.checkpoints[0].originalUrl = 'https://www.cdc.gov/act-early/digital-online-checklist/4-months.html';
  draft.checkpoints[0].sourceUrl = register.checkpoints[0].originalUrl;
  assert.ok(report(register, draft).issues.some(issue => issue.code === 'checkpoint-source-mismatch'));
});

test('CP-002: reject a changed checkpoint identity', () => {
  const draft = structuredClone(milestoneDraft);
  draft.checkpoints[0].id = 'renamed-checkpoint';
  assert.ok(report(sourceRegister, draft).issues.some(issue => issue.code === 'checkpoint-id-mismatch'));
});

test('CP-002: reject duplicate identities, altered wording and non-CDC categories', () => {
  const draft = structuredClone(milestoneDraft);
  draft.checkpoints[0].milestones[1].id = draft.checkpoints[0].milestones[0].id;
  draft.checkpoints[0].milestones[2].sourceStatement += ' (edited)';
  draft.checkpoints[0].milestones[3].originalCategory = 'Fine Motor';
  const codes = report(sourceRegister, draft).issues.map(issue => issue.code);
  assert.ok(codes.includes('duplicate-milestone-id'));
  assert.ok(codes.includes('checkpoint-content-fingerprint'));
  assert.ok(codes.includes('unrecognized-category'));
});

test('CP-002: reject a changed identity even when it remains unique', () => {
  const draft = structuredClone(milestoneDraft);
  draft.checkpoints[0].milestones[0].id = 'new-unique-identity';
  assert.ok(report(sourceRegister, draft).issues.some(issue => issue.code === 'milestone-id-mismatch'));
});

test('CP-002: malformed milestone records are reported instead of crashing validation', () => {
  const draft = structuredClone(milestoneDraft);
  draft.checkpoints[0].milestones[0] = null;
  const result = report(sourceRegister, draft);
  assert.ok(result.issues.some(issue => issue.code === 'milestone-record-invalid'));
});

test('CP-002: malformed metadata shapes produce issues instead of runtime exceptions', () => {
  for (const malformedCategories of [null, 3, {}, true]) {
    const register = structuredClone(sourceRegister);
    const draft = structuredClone(milestoneDraft);
    register.checkpoints[0].originalCategories = malformedCategories;
    draft.edition = 12;
    draft.attribution = {};
    const result = report(register, draft);
    const codes = result.issues.map(issue => issue.code);
    assert.ok(codes.includes('register-category-inventory'));
    assert.ok(codes.includes('draft-edition-metadata-incomplete'));
    assert.ok(codes.includes('incomplete-attribution'));
  }
});

test('CP-002: reject missing attribution and missing original-category coverage', () => {
  const draft = structuredClone(milestoneDraft);
  draft.attribution = 'CDC content.';
  draft.checkpoints[0].milestones = draft.checkpoints[0].milestones.filter(item => item.originalCategory !== 'Movement/Physical Development');
  const codes = report(sourceRegister, draft).issues.map(issue => issue.code);
  assert.ok(codes.includes('incomplete-attribution'));
  assert.ok(codes.includes('missing-category'));
});
