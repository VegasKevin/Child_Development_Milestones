import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Bogota' });
async function open(page) {
  await page.clock.install({ time: new Date('2026-11-15T17:00:00Z') });
  await page.goto('/#/profiles');
}
async function create(page, label = 'Fictional managed child') {
  await page.getByLabel('Display label (optional)', { exact: true }).fill(label);
  await page.getByLabel('Birth date', { exact: true }).fill('2026-05-15');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child')).toBeVisible();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
}
const row = (page, label) => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: label, exact: true }) });

test('FR-001: edit a stable profile, cancel removal, remove selected child and retain sibling', async ({ page }, testInfo) => {
  await open(page);
  await create(page);
  const before = await page.evaluate(async () => (await (await import('/profile-store.js')).profileStore('local-demo').load()).profiles[0]);
  await row(page, 'Fictional managed child').getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Birth date', { exact: true })).toHaveValue('2026-05-15');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Fictional edited child');
  await page.getByLabel('Birth information').selectOption('month');
  await page.getByLabel('Birth month and year', { exact: true }).fill('2026-08');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional edited child');
  await expect(page.locator('.age-tag')).toContainText('approximately 2 to 3 months');
  const after = await page.evaluate(async () => (await (await import('/profile-store.js')).profileStore('local-demo').load()).profiles[0]);
  expect(after.id).toBe(before.id);
  expect(after.revision).toBe(before.revision + 1);
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await create(page, 'Fictional sibling');
  await row(page, 'Fictional edited child').getByRole('button', { name: /^Use / }).click();
  await page.getByRole('link', { name: 'Profiles', exact: true }).click();
  await row(page, 'Fictional edited child').getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('button', { name: 'Keep profile', exact: true }).click();
  await expect(row(page, 'Fictional edited child')).toBeVisible();
  await expect(row(page, 'Fictional edited child').getByRole('button', { name: 'Remove', exact: true })).toBeFocused();
  await row(page, 'Fictional edited child').getByRole('button', { name: 'Remove', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('remove-profile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with an age.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Selected child').locator('option')).toHaveCount(2);
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Browse without a profile');
  await page.getByLabel('Selected child').selectOption({ label: 'Fictional sibling' });
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
});

test('LS-001: failed update preserves committed birth information and the edit draft', async ({ page }) => {
  await open(page);
  await create(page);
  await row(page, 'Fictional managed child').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Fictional unsaved edit');
  await page.getByLabel('Birth date', { exact: true }).fill('2026-08-15');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.name === 'profiles') request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save changes.');
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Fictional unsaved edit');
  await expect(page.getByLabel('Birth date', { exact: true })).toHaveValue('2026-08-15');
  await page.reload();
  await row(page, 'Fictional managed child').getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Birth date', { exact: true })).toHaveValue('2026-05-15');
});

test('LS-001: a stale edit cannot overwrite a newer change from another tab', async ({ page, context }) => {
  await open(page);
  await create(page);
  const second = await context.newPage();
  await open(second);
  await row(page, 'Fictional managed child').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Stale draft');
  await row(second, 'Fictional managed child').getByRole('button', { name: 'Edit', exact: true }).click();
  await second.getByLabel('Display label (optional)', { exact: true }).fill('Newest committed label');
  await second.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(second.getByLabel('Selected child').locator('option:checked')).toHaveText('Newest committed label');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab changed or removed this profile.');
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Stale draft');
  await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
  await page.getByRole('button', { name: 'Reload profiles', exact: true }).click();
  await expect(row(page, 'Newest committed label')).toBeVisible();
});

test('LS-004: unsupported newer profile data remains untouched and anonymous browsing works', async ({ page }) => {
  await open(page);
  await create(page);
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('milestone-guide-profiles:local-demo', 3);
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    });
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Could not read local profiles.');
  await expect(page.getByRole('button', { name: 'Create profile', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await page.getByLabel('Age in months', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
  const records = await page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open('milestone-guide-profiles:local-demo');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('profiles').objectStore('profiles').getAll();
      read.onsuccess = () => { const value = read.result; db.close(); resolve(value); };
    };
  }));
  expect(records).toHaveLength(1);
  expect(records[0].label).toBe('Fictional managed child');
});

test('LS-001: failed removal keeps the selected profile and its committed birth information', async ({ page }) => {
  await open(page);
  await create(page);
  await page.evaluate(() => {
    const remove = IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.delete = function (...args) {
      const request = remove.apply(this, args);
      if (this.name === 'profiles') request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await row(page, 'Fictional managed child').getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not remove this profile.');
  await page.reload();
  await row(page, 'Fictional managed child').getByRole('button', { name: /^Use / }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional managed child');
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
});

test('LS-004: unsupported record fields are preserved rather than silently overwritten', async ({ page }) => {
  await open(page);
  await create(page);
  await page.evaluate(async () => {
    const { profileStore } = await import('/profile-store.js');
    const record = (await profileStore('local-demo').load()).profiles[0];
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('milestone-guide-profiles:local-demo', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('profiles', 'readwrite');
        tx.objectStore('profiles').put({ ...record, futureField: 'synthetic newer shape' });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => reject(tx.error);
      };
    });
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Could not read local profiles.');
  await expect(page.getByRole('button', { name: 'Create profile', exact: true })).toBeDisabled();
  const records = await page.evaluate(async () => new Promise(resolve => {
    const request = indexedDB.open('milestone-guide-profiles:local-demo', 2);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('profiles').objectStore('profiles').getAll();
      read.onsuccess = () => { db.close(); resolve(read.result); };
    };
  }));
  expect(records[0].futureField).toBe('synthetic newer shape');
  expect(records[0].revision).toBe(1);
});

test('FR-001: a corrected device clock leaves profile management and temporary age accessible', async ({ page }) => {
  await open(page);
  await create(page);
  await page.clock.setSystemTime(new Date('2026-05-01T17:00:00Z'));
  await page.reload();
  await expect(row(page, 'Fictional managed child')).toBeVisible();
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Birth-based age unavailable.', exact: true })).toBeVisible();
  await page.getByLabel('Age in months', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Fictional managed child');
});
