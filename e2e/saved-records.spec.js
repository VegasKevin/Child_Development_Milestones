import { test, expect } from '@playwright/test';
import { releaseTwo } from '../fixtures/synthetic-catalogs.js';

test('FR-007/DM-005: save a CDC milestone locally for the selected child and reopen it', async ({ page }, testInfo) => {
  await page.goto('/#/profiles');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await page.getByLabel('Age in months', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.getByRole('link', { name: /Social\/Emotional/ }).click();
  await page.getByRole('link', { name: 'Knows familiar people', exact: true }).click();
  await page.getByRole('button', { name: 'Save behavior to Saved', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove from Saved', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved for Child 1', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Knows familiar people/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('saved-milestones.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 760 });
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /^Knows familiar people/ })).toBeVisible();
  await expect(page.getByText(/saved in this browser/i)).toBeVisible();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nothing saved yet.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Nothing saved yet.', exact: true })).toBeVisible();
});

test('DM-005/LS-001: favorites stay child-scoped and profile removal clears them atomically', async ({ page }) => {
  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('First child');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await page.getByLabel('Age in months', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.getByRole('link', { name: /Social\/Emotional/ }).click();
  await page.getByRole('link', { name: 'Knows familiar people', exact: true }).click();
  await page.getByRole('button', { name: 'Save behavior to Saved', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Delete this with the profile.');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();

  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Second child');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-08-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved for Second child', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nothing saved yet.', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByRole('button', { name: 'Use First child', exact: true }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('link', { name: /^Knows familiar people/ })).toBeVisible();

  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByRole('list', { name: 'Local child profiles' }).getByRole('listitem')
    .filter({ hasText: 'First child' }).getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText(/saved items, and practice history/)).toBeVisible();
  await page.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option', { hasText: 'First child' })).toHaveCount(0);
  const personalRecordCounts = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('milestone-guide-profiles:local-demo', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = database.transaction(['favorites', 'practice']);
    const counts = await Promise.all(['favorites', 'practice'].map(store => new Promise((resolve, reject) => {
      const request = tx.objectStore(store).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    })));
    database.close();
    return counts;
  });
  expect(personalRecordCounts).toEqual([0, 0]);
});

test('DEC-007/DM-006: a safety-withdrawn favorite stays saved and is labeled Withdrawn', async ({ page }) => {
  await page.goto('/#/profiles');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await page.getByRole('button', { name: 'Save activity to Saved', exact: true }).click();

  await page.route('**/fixtures/guide-catalog.js', route => route.fulfill({
    contentType: 'text/javascript', body: `export const guideCatalog = ${JSON.stringify(releaseTwo)};`,
  }));
  await page.reload();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('link', { name: /^Fictional shared activity/ })).toHaveCount(0);
  await expect(page.getByText('Withdrawn', { exact: true })).toBeVisible();
  await expect(page.getByText('Fictional shared activity', { exact: true })).toBeVisible();
});
