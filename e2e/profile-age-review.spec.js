import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Bogota' });
async function open(page, time = '2026-11-15T17:00:00Z') {
  await page.clock.install({ time: new Date(time) });
  await page.goto('/#/profiles');
}
async function create(page, birth, mode = 'date') {
  await page.getByLabel('Birth information').selectOption(mode);
  await page.locator('#profile-birth').fill(birth);
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child')).toBeVisible();
}

test('independent DEC-003: month-end collapses possible age, retires preview, and keeps corrected-age draft', async ({ page }) => {
  await open(page, '2026-11-30T04:59:50Z');
  await create(page, '2026-05', 'month');
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  await page.getByRole('button', { name: 'Preview the 6-month checklist', exact: true }).click();
  await page.getByLabel('Age in months', { exact: true }).fill('3');
  await page.clock.fastForward(70_000);
  await expect(page.locator('.age-tag')).toContainText('approximately 6 to 6 months');
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Preview the/ })).toHaveCount(0);
  await expect(page.getByLabel('Age in months', { exact: true })).toHaveValue('3');
});

test('independent DEC-014: focus return updates birth age but preserves active override and its preview', async ({ page }) => {
  await open(page);
  await create(page, '2026-05-16');
  await page.getByLabel('Age in months', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.getByRole('button', { name: 'Preview the 2-month checklist', exact: true }).click();
  await page.clock.setSystemTime(new Date('2026-11-16T17:00:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.age-tag')).toContainText('temporary age 0 months');
  await expect(page.getByRole('heading', { name: '2-month checklist preview', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Use birth-based age', exact: true }).click();
  await expect(page.locator('.age-tag')).toContainText('6 months');
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
});

test('independent DM-004: clamped exact day refreshes category detail at local midnight', async ({ page }) => {
  await open(page, '2027-02-28T04:59:50Z');
  await create(page, '2026-08-31');
  await page.getByRole('link', { name: /Social\/Emotional/ }).click();
  await expect(page.locator('.age-tag')).toContainText('5 months');
  await page.clock.fastForward(70_000);
  await expect(page.locator('.age-tag')).toContainText('6 months');
  await expect(page.locator('.lead')).toContainText('6 months');
});

test('independent LS-001: failed month write and day refresh retain precision and draft until retry', async ({ page }) => {
  await open(page);
  await create(page, '2026-05-15');
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByLabel('Birth information').selectOption('month');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Month draft');
  await page.locator('#profile-birth').fill('2026-07');
  await page.evaluate(() => {
    window.__originalAdd = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      const request = window.__originalAdd.apply(this, args);
      if (this.name === 'profiles') request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save this profile');
  await page.clock.setSystemTime(new Date('2026-11-16T17:00:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByLabel('Birth information')).toHaveValue('month');
  await expect(page.locator('#profile-birth')).toHaveValue('2026-07');
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Month draft');
  await page.evaluate(() => { IDBObjectStore.prototype.add = window.__originalAdd; });
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.locator('.age-tag')).toContainText('Month draft: approximately 3 to 4 months');
});

test('independent FR-001: rejected corrected ages preserve the selected birth-based checklist', async ({ page }) => {
  await open(page);
  await create(page, '2026-05', 'month');
  for (const value of ['-1', '2.5', '9007199254740992', '']) {
    await page.getByLabel('Age in months', { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
    await expect(page.locator('#age-error')).toContainText('Enter a whole number');
    await expect(page.getByRole('heading', { name: '4 months', exact: true })).toBeVisible();
    await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
  }
});

test('independent mobile-ui: month creation controls stay usable at 320px and enlarged text', async ({ page }, testInfo) => {
  await open(page);
  await page.getByLabel('Birth information').selectOption('month');
  await page.locator('#profile-birth').fill('2026-05');
  await page.screenshot({ path: testInfo.outputPath('month-form.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.locator('#profile-birth')).toHaveValue('2026-05');
  for (const selector of ['#birth-mode', '#profile-birth']) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('month-form-320-enlarged.png'), fullPage: true });
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.locator('.age-tag')).toContainText('approximately 5 to 6 months');
});
