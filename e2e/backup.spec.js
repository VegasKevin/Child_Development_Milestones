import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('IF-007: changes in another tab invalidate replacement confirmation', async ({ page, context }) => {
  await page.goto('/#/backup');
  await page.getByLabel('Backup file', { exact: true }).setInputFiles('fixtures/backup-v1.json');
  await page.getByLabel('Restore password', { exact: true }).fill('fixture password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replace local records', exact: true })).toBeVisible();
  const sibling = await context.newPage();
  await sibling.goto('/#/profiles');
  await sibling.getByLabel('Display label (optional)', { exact: true }).fill('Created after preview');
  await sibling.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await sibling.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(sibling.getByRole('heading', { name: 'Milestones', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Replace local records', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Local records changed');
  const snapshot = await page.evaluate(async () => (await import('/backup-store.js')).backupStore('local-demo').snapshot());
  expect(snapshot.profiles.map(item => item.label)).toEqual(['Created after preview']);
  await page.getByLabel('Restore password', { exact: true }).fill('fixture password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByText('Currently on this device: 1 profiles, 0 favorites, 0 practice entries.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Replace local records', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Restored');
});

test('LS-003/004: a large valid encrypted backup can be restored', async ({ page }) => {
  await page.goto('/#/backup');
  const text = await page.evaluate(async () => {
    const { encryptBackup } = await import('/src/backup.js');
    return encryptBackup({ schemaVersion: 1, profiles: [{ id: 'large-child', label: 'Large backup', birth: { year: 2025, month: 1 }, revision: 1 }], favorites: [],
      practice: Array.from({ length: 1000 }, (_, i) => ({ id: `entry-${i}`, childId: 'large-child', activityId: 'missing', activityRevision: 1, activityTitle: 'Synthetic activity', practiceDate: '2026-01-01', notes: 'x'.repeat(4000) })) }, 'large fixture password');
  });
  await page.getByLabel('Backup file', { exact: true }).setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await page.getByLabel('Restore password', { exact: true }).fill('large fixture password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByText('1 profiles, 0 favorites, 1000 practice entries', { exact: true })).toBeVisible();
});

test('LS-A03/A05/DM-A06: compatible backup previews missing references, cancels and rolls back an interrupted restore', async ({ page }) => {
  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Keep existing child');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByRole('link', { name: 'Backup and restore', exact: true }).click();
  await page.getByLabel('Backup file', { exact: true }).setInputFiles('fixtures/backup-v1.json');
  await page.getByLabel('Restore password', { exact: true }).fill('fixture password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByText(/2 unresolved catalog references/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel restore', exact: true }).click();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Use Keep existing child', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Backup and restore', exact: true }).click();
  await page.getByLabel('Backup file', { exact: true }).setInputFiles('fixtures/backup-v1.json');
  await page.getByLabel('Restore password', { exact: true }).fill('fixture password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replace local records', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      const request = original.apply(this, args);
      if (this.name === 'profiles') request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
    window.undoRestoreFailure = () => { IDBObjectStore.prototype.add = original; };
  });
  await page.getByRole('button', { name: 'Replace local records', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not restore');
  const snapshot = await page.evaluate(async () => (await import('/backup-store.js')).backupStore('local-demo').snapshot());
  expect(snapshot.profiles.map(item => item.label)).toEqual(['Keep existing child']);
  await page.evaluate(() => window.undoRestoreFailure());
  await page.getByRole('button', { name: 'Replace local records', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Restored');
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByRole('button', { name: 'Use Fixture child', exact: true }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await page.getByRole('link', { name: /Archived play Unavailable activity. History remains/ }).click();
  await expect(page.getByText('<b>Synthetic note</b>', { exact: true })).toBeVisible();
  await expect(page.locator('.practice-list b')).toHaveCount(0);
});

test('FR-010/LS-003/004: encrypted export, validated preview and confirmed replacement', async ({ page }, info) => {
  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Backup child');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await page.getByRole('button', { name: 'Save activity to Saved', exact: true }).click();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Private backup observation');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByRole('link', { name: 'Backup and restore', exact: true }).click();
  await expect(page.getByText(/losing the password prevents recovery/i)).toBeVisible();
  await page.getByLabel('Backup password', { exact: true }).fill('test-only password');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export encrypted backup', exact: true }).click();
  const download = await downloadPromise;
  const bytes = await readFile(await download.path());
  expect(bytes.toString()).not.toContain('Private backup observation');
  expect(bytes.toString()).not.toContain('Backup child');
  await page.getByLabel('Backup file', { exact: true }).setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: bytes });
  await page.getByLabel('Restore password', { exact: true }).fill('wrong password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not open');
  await page.getByLabel('Restore password', { exact: true }).fill('test-only password');
  await page.getByRole('button', { name: 'Preview restore', exact: true }).click();
  await expect(page.getByText('1 profiles, 1 favorites, 1 practice entries', { exact: true })).toBeVisible();
  await expect(page.getByText(/replaces all existing personal records/i)).toBeVisible();
  await page.screenshot({ path: info.outputPath('backup-preview.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 760 });
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Replace local records', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Restored');
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Use Backup child', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Use Backup child', exact: true }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity Practice history', exact: true }).click();
  await expect(page.getByText('Private backup observation', { exact: true })).toBeVisible();
});
