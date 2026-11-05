import { test, expect } from '@playwright/test';
import { releaseTwo } from '../fixtures/synthetic-catalogs.js';

test.use({ timezoneId: 'America/Bogota' });

test('FR-007/008/DM-005: log a local practice session and reopen activity history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T17:00:00Z') });
  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Practice child');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Log practice', exact: true })).toBeVisible();
  await expect(page.getByText(/For Practice child\./)).toBeVisible();
  await expect(page.getByLabel('Practice date', { exact: true })).toHaveValue('2026-11-05');
  await expect(page.getByLabel('Difficulty (optional)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Notes (optional)', { exact: true })).toBeVisible();
  await page.getByLabel('Difficulty (optional)', { exact: true }).selectOption('Moderate');
  await page.getByLabel('Notes (optional)', { exact: true }).fill('We tried this together.');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Practice history', exact: true })).toBeVisible();
  await expect(page.getByText('2026-11-05', { exact: true })).toBeVisible();
  await expect(page.getByText('Difficulty: Moderate', { exact: true })).toBeVisible();
  await expect(page.getByText('We tried this together.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();
  await page.getByLabel('Practice date', { exact: true }).fill('2026-11-03');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();
  const dates = await page.locator('.practice-list time').allTextContents();
  expect(dates).toEqual(['2026-11-05', '2026-11-03']);
  await expect(page.locator('.practice-list li').nth(1)).not.toContainText('Difficulty:');
  await expect(page.locator('.practice-list li').nth(1).locator('p')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('We tried this together.', { exact: true })).toBeVisible();
  await expect(page.getByText(/saved locally/i)).toBeVisible();
});

test('FR-008: practice history stays scoped to the selected child and activity', async ({ page }) => {
  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('History first');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('First activity observation.');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional second activity', exact: true }).click();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Second activity observation.');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();

  await page.goto('/#/profiles');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('History second');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-08-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved for History second', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Activity history', exact: true })).toHaveCount(0);

  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByRole('button', { name: 'Use History first', exact: true }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Activity history', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Fictional shared activity Practice history', exact: true }).click();
  await expect(page.getByText('First activity observation.', { exact: true })).toBeVisible();
  await expect(page.getByText('Second activity observation.', { exact: true })).toHaveCount(0);
});

test('DEC-007/DM-006: withdrawn activity keeps dated practice history without its instructions', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T17:00:00Z') });
  await page.goto('/#/profiles');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await page.getByRole('button', { name: 'Log practice', exact: true }).click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('A note to retain after withdrawal.');
  await page.getByRole('button', { name: 'Save practice', exact: true }).click();

  await page.route('**/fixtures/guide-catalog.js', route => route.fulfill({
    contentType: 'text/javascript', body: `export const guideCatalog = ${JSON.stringify(releaseTwo)};`,
  }));
  await page.reload();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await page.getByRole('link', { name: /Fictional shared activity.*History remains/ }).click();
  await expect(page.getByText(/activity was withdrawn/i)).toBeVisible();
  await expect(page.getByText('A note to retain after withdrawal.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log practice', exact: true })).toHaveCount(0);
  await expect(page.getByText(/instructions are hidden/i)).toBeVisible();
});
