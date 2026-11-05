import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decryptBackup, encryptBackup, validateBackup } from '../src/backup.js';
const fixture = await readFile(new URL('../fixtures/backup-v1.json', import.meta.url), 'utf8');

test('LS-003/004: independent Node crypto v1 vector decrypts, unresolved references survive and exports use fresh randomness', async () => {
  const data = await decryptBackup(fixture, 'fixture password');
  assert.equal(data.practice[0].notes, '<b>Synthetic note</b>');
  assert.equal(data.favorites[0].contentId, 'missing-activity');
  const first = await encryptBackup(data, 'a different password');
  const second = await encryptBackup(data, 'a different password');
  assert.notEqual(JSON.parse(first).salt, JSON.parse(second).salt);
  assert.notEqual(JSON.parse(first).iv, JSON.parse(second).iv);
  assert.deepEqual(await decryptBackup(first, 'a different password'), data);
});

test('LS-A04: wrong password, corrupted ciphertext and unsupported versions fail', async () => {
  await assert.rejects(decryptBackup(fixture, 'wrong password'));
  const changed = JSON.parse(fixture);
  changed.ciphertext = (changed.ciphertext[0] === 'A' ? 'B' : 'A') + changed.ciphertext.slice(1);
  await assert.rejects(decryptBackup(JSON.stringify(changed), 'fixture password'));
  changed.version = 2;
  await assert.rejects(decryptBackup(JSON.stringify(changed), 'fixture password'), /Unsupported/);
});

test('DM-007: reject duplicates, dangling children, unsupported fields, bad dates and unknown payload schema', async () => {
  const data = await decryptBackup(fixture, 'fixture password');
  for (const mutate of [
    item => item.profiles.push(item.profiles[0]), item => item.favorites.push(item.favorites[0]),
    item => item.practice.push(item.practice[0]), item => { item.practice[0].childId = 'missing-child'; },
    item => { item.practice[0].practiceDate = '2026-02-30'; }, item => { item.schemaVersion = 2; },
    item => { item.credentials = 'excluded'; }, item => { item.profiles[0].email = 'excluded'; },
  ]) {
    const candidate = structuredClone(data); mutate(candidate);
    assert.throws(() => validateBackup(candidate));
  }
});
