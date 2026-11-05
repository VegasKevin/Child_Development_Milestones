import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Bogota' });
async function open(page, time = '2026-11-15T17:00:00Z') {
  await page.clock.install({ time: new Date(time) });
  await page.goto('/#/profiles');
}
async function monthProfile(page, month = '2026-05') {
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Fictional month child');
  await page.getByLabel('Birth information').selectOption('month');
  await page.getByLabel('Birth month and year', { exact: true }).fill(month);
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
}

test('DEC-005/DM-A02: birth month defaults younger and offers a labeled next-checklist preview', async ({ page }, testInfo) => {
  await open(page);
  await monthProfile(page);
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  await expect(page.getByRole('heading', { name: 'Fictional 4-month checklist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview the 6-month checklist', exact: true }).click();
  await expect(page.getByRole('heading', { name: '6-month checklist preview', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Fictional category/ }).click();
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  await expect(page.locator('.age-tag')).toContainText('6-month checklist preview');
  await page.getByRole('link', { name: 'Back to milestones', exact: true }).click();
  await page.getByRole('button', { name: 'Return to age result', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional 4-month checklist', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  await page.screenshot({ path: testInfo.outputPath('month-profile.png'), fullPage: true });
});

test('DEC-014/DM-A03: temporary corrected age retains child, clears on child switch and reload', async ({ page }) => {
  await open(page);
  await monthProfile(page);
  const childId = await page.getByLabel('Selected child').inputValue();
  await page.getByLabel('Age in months', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await expect(page.locator('.age-tag')).toContainText('temporary age 2 months');
  await expect(page.getByLabel('Selected child')).toHaveValue(childId);
  await expect(page.getByRole('heading', { name: 'Fictional 2-month checklist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Use birth-based age', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional 4-month checklist', exact: true })).toBeVisible();
  await page.getByLabel('Age in months', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.reload();
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  await expect(page.getByLabel('Age in months', { exact: true })).toHaveValue('');
  await page.getByLabel('Age in months', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.getByLabel('Selected child').selectOption('');
  await page.getByLabel('Selected child').selectOption(childId);
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  const stored = await page.evaluate(async () => {
    const { profileStore } = await import('/profile-store.js');
    return profileStore('local-demo').load();
  });
  expect(stored.profiles[0].birth).toEqual({ year: 2026, month: 5 });
  expect(Object.keys(stored.profiles[0]).sort()).toEqual(['birth', 'id', 'label', 'revision']);
});

test('DM-004: age updates across local midnight without reloading', async ({ page }) => {
  await open(page, '2026-11-16T04:59:50Z');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-16');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional 4-month checklist', exact: true })).toBeVisible();
  await page.clock.fastForward(70_000);
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
});

test('DEC-005: month age below first checkpoint keeps coverage message with optional preview', async ({ page }) => {
  await open(page);
  await monthProfile(page, '2026-09');
  await expect(page.getByRole('heading', { name: 'A little early for this checklist.', exact: true })).toBeVisible();
  await expect(page.locator('.age-tag')).toContainText('approximately 1 to 2 months');
  await page.getByRole('button', { name: 'Preview the 2-month checklist', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2-month checklist preview', exact: true })).toBeVisible();
});

test('DM-004: month precision validates future input and never assumes a birth day', async ({ page }) => {
  await open(page);
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Fictional precision child');
  await page.getByLabel('Birth information').selectOption('month');
  await page.getByLabel('Birth month and year', { exact: true }).fill('2026-12');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a valid birth month and year that is not in the future.');
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Fictional precision child');
  await page.getByLabel('Birth month and year', { exact: true }).fill('2026-11');
  await page.getByLabel('Birth information').selectOption('date');
  await expect(page.getByLabel('Birth date', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a valid birth date that is not in the future.');
  await page.getByLabel('Birth information').selectOption('month');
  await page.getByLabel('Birth month and year', { exact: true }).fill('2026-11');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.locator('.age-tag')).toContainText('approximately 0 to 0 months');
  await expect(page.getByRole('heading', { name: 'A little early for this checklist.', exact: true })).toBeVisible();
});
