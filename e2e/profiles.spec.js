import { test, expect, chromium } from '@playwright/test';

test.use({ timezoneId: 'America/Bogota' });
const initialTime = new Date('2026-11-15T17:00:00Z');

async function visit(page) {
  await page.clock.install({ time: initialTime });
  await page.goto('/');
}

async function create(page, label, birth) {
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).fill(label);
  await page.getByLabel('Birth date', { exact: true }).fill(birth);
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
}

test('FR-001/P1: create, persist and select multiple birth-based local profiles', async ({ page }, testInfo) => {
  const requests = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await visit(page);
  await create(page, 'Fictional <Milo> & sibling', '2026-05-15');
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional <Milo> & sibling');
  await page.screenshot({ path: testInfo.outputPath('profile-checklist.png'), fullPage: true });
  await create(page, 'Fictional sibling', '2026-08-15');
  await expect(page.getByRole('heading', { name: 'Fictional 2-month checklist', exact: true })).toBeVisible();
  await page.getByLabel('Selected child').selectOption({ label: 'Fictional <Milo> & sibling' });
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional <Milo> & sibling');
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.getByLabel('Selected child').selectOption('');
  await expect(page.getByRole('heading', { name: 'Start with an age.', exact: true })).toBeVisible();
  await page.getByLabel('Age in months', { exact: true }).fill('7');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Local child profiles' }).getByRole('button', { name: /^Use / })).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('profiles.png'), fullPage: true });
  expect(requests.every(request => request.method === 'GET' && request.body === null &&
    request.url.startsWith('http://127.0.0.1:4174/') && !request.url.includes('?') && !request.url.includes('2026-05-15'))).toBe(true);
  expect(await page.locator('milo').count()).toBe(0);
});

test('LS-001: an aborted transaction preserves existing profiles and unsaved input', async ({ page }) => {
  await visit(page);
  await create(page, 'Fictional existing child', '2026-05-15');
  await page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true }).waitFor();
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      const request = add.apply(this, args);
      if (this.name === 'profiles') request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await create(page, 'Fictional unsaved child', '2026-08-15');
  await expect(page.getByRole('alert')).toContainText('Could not save this profile.');
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Fictional unsaved child');
  await page.reload();
  await expect(page.getByRole('list', { name: 'Local child profiles' }).getByRole('button', { name: /^Use / })).toHaveCount(1);
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional existing child');
});

test('FR-014: profile entry works with keyboard and narrow enlarged text', async ({ page }, testInfo) => {
  await visit(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).focus();
  await page.keyboard.type('Fictional keyboard child');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Birth date', { exact: true })).toBeFocused();
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Milestones', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('profiles-enlarged.png'), fullPage: true });
});

test('FR-001/LS-001: invalid or unavailable storage preserves form and does not report success', async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBFactory.prototype.open;
    window.__blockProfileOpen = sessionStorage.getItem('synthetic-storage-recovered') !== 'yes';
    IDBFactory.prototype.open = function (...args) {
      if (window.__blockProfileOpen) throw new DOMException('Synthetic unavailable storage', 'SecurityError');
      return original.apply(this, args);
    };
  });
  await visit(page);
  await create(page, 'Fictional retry', '2027-01-01');
  await expect(page.getByRole('alert')).toContainText('Enter a valid birth date that is not in the future.');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save this profile.');
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Fictional retry');
  await expect(page.getByLabel('Birth date', { exact: true })).toHaveValue('2026-05-15');
  await page.evaluate(() => {
    window.__blockProfileOpen = false;
    sessionStorage.setItem('synthetic-storage-recovered', 'yes');
  });
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Selected child').locator('option')).toHaveCount(2);
});

test('FR-001/DM-004: a real browser restart retains selection and recalculates local calendar age', async ({}, testInfo) => {
  const userDataDir = testInfo.outputPath('profile-browser');
  const options = { channel: 'chrome', headless: true, timezoneId: 'America/Bogota', viewport: { width: 390, height: 844 } };
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, options);
    let page = context.pages()[0];
    await page.clock.install({ time: initialTime });
    await page.goto('http://127.0.0.1:4174/');
    await create(page, 'Fictional returning child', '2026-05-16');
    await expect(page.getByRole('heading', { name: 'Fictional 4-month checklist', exact: true })).toBeVisible();
    await context.close();
    context = await chromium.launchPersistentContext(userDataDir, options);
    page = context.pages()[0];
    await page.clock.install({ time: new Date('2026-11-16T17:00:00Z') });
    await page.goto('http://127.0.0.1:4174/');
    await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional returning child');
    await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  } finally {
    await context?.close();
  }
});
