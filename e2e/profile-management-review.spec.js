import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Bogota' });
const row = (page, label) => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: label, exact: true }) });
const profiles = page => page.getByRole('link', { name: 'Profiles', exact: true }).click();
async function visit(page) {
  await page.clock.install({ time: new Date('2026-11-15T17:00:00Z') });
  await page.goto('/#/profiles');
}
async function create(page, label, birth = '2026-05-15') {
  await page.getByLabel('Display label (optional)', { exact: true }).fill(label);
  await page.getByLabel('Birth date', { exact: true }).fill(birth);
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child')).toBeVisible();
  await profiles(page);
}
const stored = page => page.evaluate(async () => (await import('/profile-store.js')).profileStore('local-demo').load());

test('review LS-001: navigating during an in-flight edit commits once and restores usable controls', async ({ page }) => {
  await visit(page);
  await create(page, 'Review delayed');
  await row(page, 'Review delayed').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Review committed once');
  await page.evaluate(() => {
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (...args) => {
      const request = open(...args);
      request.addEventListener('success', event => {
        if (!event.isTrusted) return;
        event.stopImmediatePropagation();
        setTimeout(() => request.dispatchEvent(new Event('success')), 700);
      });
      return request;
    };
  });
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Activity library', exact: true })).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Review committed once');
  const result = await stored(page);
  expect(result.profiles).toHaveLength(1);
  expect(result.profiles[0].revision).toBe(2);
  await profiles(page);
  await expect(page.getByRole('button', { name: 'Create profile', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('');
});

test('review FR-001: stale removals cannot delete edited records or change another selected child', async ({ page, context }) => {
  await visit(page);
  await create(page, 'Review alpha');
  await create(page, 'Review beta');
  const other = await context.newPage();
  await visit(other);
  await row(page, 'Review alpha').getByRole('button', { name: 'Remove', exact: true }).click();
  await row(other, 'Review alpha').getByRole('button', { name: 'Edit', exact: true }).click();
  await other.getByLabel('Display label (optional)', { exact: true }).fill('Review updated alpha');
  await other.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(other.getByLabel('Selected child').locator('option:checked')).toHaveText('Review beta');
  const committed = await stored(other);
  await page.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab changed or removed');
  expect(await stored(page)).toEqual(committed);
  await profiles(other);
  await row(other, 'Review updated alpha').getByRole('button', { name: 'Remove', exact: true }).click();
  await other.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(other.getByLabel('Selected child').locator('option:checked')).toHaveText('Review beta');
  await page.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab changed or removed');
  const final = await stored(page);
  expect(final.profiles.map(profile => profile.label)).toEqual(['Review beta']);
  expect(final.selectedId).toBe(committed.selectedId);
});

test('review FR-001: cancel and successful edit preserve the separate create draft and blank labels avoid collisions', async ({ page }) => {
  await visit(page);
  await create(page, 'Child 1');
  await create(page, 'Review renamed');
  await page.getByLabel('Display label (optional)', { exact: true }).fill('Review pending creation');
  await page.getByLabel('Birth information').selectOption('month');
  await page.getByLabel('Birth month and year', { exact: true }).fill('2026-09');
  await row(page, 'Review renamed').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).fill('discard me');
  await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Review pending creation');
  await expect(page.getByLabel('Birth month and year', { exact: true })).toHaveValue('2026-09');
  await row(page, 'Review renamed').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Display label (optional)', { exact: true }).fill('  ');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Child 2');
  await profiles(page);
  await expect(page.getByLabel('Display label (optional)', { exact: true })).toHaveValue('Review pending creation');
  await expect(page.getByLabel('Birth month and year', { exact: true })).toHaveValue('2026-09');
  await page.getByRole('button', { name: 'Create profile', exact: true }).click();
  await expect(page.getByLabel('Selected child').locator('option:checked')).toHaveText('Review pending creation');
  expect((await stored(page)).profiles).toHaveLength(3);
});

test('review DM-004: invalid edits leave the committed profile unchanged and older children remain manageable', async ({ page }, testInfo) => {
  await visit(page);
  await create(page, 'Review older child', '2020-11-15');
  const before = await stored(page);
  await row(page, 'Review older child').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Birth date', { exact: true }).fill('2026-11-16');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not in the future');
  expect(await stored(page)).toEqual(before);
  await page.getByLabel('Birth date', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  expect(await stored(page)).toEqual(before);
  await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Outside checklist coverage.', exact: true })).toBeVisible();
  await page.getByLabel('Age in months', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await expect(page.locator('.age-tag')).toHaveText('Review older child: temporary age 6 months');
  expect(await stored(page)).toEqual(before);
  await profiles(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await row(page, 'Review older child').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('review-edit-narrow.png'), fullPage: true });
  await row(page, 'Review older child').getByRole('button', { name: 'Remove', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('review-remove-narrow.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Remove profile from this browser', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with an age.', exact: true })).toBeVisible();
  await page.reload();
  expect(await stored(page)).toEqual({ profiles: [], selectedId: null });
});
