import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Bogota' });

async function open(page) {
  await page.clock.install({ time: new Date('2026-11-15T17:00:00Z') });
  await page.goto('/#/profiles');
}

async function fill(page, label, birth) {
  await page.getByLabel('Display label (optional)', { exact: true }).fill(label);
  await page.getByLabel('Birth date', { exact: true }).fill(birth);
}

test('review FR-001: optional label and leap-day profile use completed calendar months', async ({ page }) => {
  await open(page);
  await fill(page, '', '2024-02-29');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Child 1');
  await expect(page.locator('.age-tag')).toContainText('32 months');
  await page.getByLabel('Age in months', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.age-tag')).toContainText('32 months');
});

test('review LS-001: rejected selection leaves persisted child unchanged', async ({ page }) => {
  await open(page);
  await fill(page, 'First', '2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child')).toBeVisible();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await fill(page, 'Second', '2026-08-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Second');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.name === 'state') request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await page.getByLabel('Selected child').selectOption({ label: 'First' });
  await expect(page.getByRole('alert')).toContainText('Could not change the selected child.');
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Second');
  await page.reload();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Second');
});

test('review LS-001: successful read retry retains the profile draft', async ({ page }) => {
  await page.addInitScript(() => {
    const databases = IDBFactory.prototype.databases;
    window.__failProfileRead = true;
    IDBFactory.prototype.databases = function (...args) {
      if (window.__failProfileRead) return Promise.reject(new DOMException('Synthetic read failure', 'SecurityError'));
      return databases.apply(this, args);
    };
  });
  await open(page);
  await expect(page.getByRole('button', { name: 'Retry loading profiles' })).toBeVisible();
  await fill(page, 'Draft during outage', '2026-05-15');
  await page.evaluate(() => { window.__failProfileRead = false; });
  await page.getByRole('button', { name: 'Retry loading profiles' }).click();
  await expect(page.getByRole('button', { name: 'Create profile', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Draft during outage');
  await expect(page.getByLabel('Birth date', { exact: true })).toHaveValue('2026-05-15');
});

test('review LS-001/005: concurrent tabs retain both creations and hostile labels stay local text', async ({ page, context }) => {
  const label = '<img src="/child-secret" onerror="window.__profileExecuted=1">';
  const requests = [];
  const logs = [];
  context.on('request', request => requests.push(request.url() + (request.postData() ?? '')));
  context.on('page', tab => tab.on('console', message => logs.push(message.text())));
  page.on('console', message => logs.push(message.text()));
  await open(page);
  const second = await context.newPage();
  await open(second);
  await fill(page, label, '2026-05-15');
  await fill(second, 'Concurrent sibling', '2026-08-15');
  await Promise.all([
    page.getByRole('button', { name: 'Create profile', exact: true }).click(),
    second.getByRole('button', { name: 'Create profile', exact: true }).click(),
  ]);
  await expect(page.getByLabel('Selected child')).toBeVisible();
  await expect(second.getByLabel('Selected child')).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Local child profiles' }).getByRole('button', { name: /^Use / })).toHaveCount(2);
  await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__profileExecuted)).toBeUndefined();
  expect(requests.some(value => value.includes('child-secret') || value.includes('2026-05-15') || value.includes('Concurrent'))).toBe(false);
  expect(logs.some(value => value.includes('child-secret') || value.includes('2026-05-15'))).toBe(false);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const birth = page.getByLabel('Birth date', { exact: true });
  await birth.fill('2026-08-15');
  await expect(birth).toHaveValue('2026-08-15');
  const bounds = await birth.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
