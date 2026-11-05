import { test, expect } from '@playwright/test';
import { discoveryCatalog } from './fixtures/discovery-catalog.js';

async function openCatalog(page, catalog = discoveryCatalog()) {
  await page.route('**/fixtures/synthetic-catalogs.js', route => route.fulfill({
    contentType: 'text/javascript', body: `export const releaseOne = ${JSON.stringify(catalog)};`,
  }));
  await page.goto('/');
  await page.getByRole('link', { name: 'Search', exact: true }).click();
}

async function apply(page) {
  await page.getByRole('button', { name: 'Search activities', exact: true }).click();
}

async function expectActivities(page, names) {
  const links = page.getByRole('list', { name: 'Activity results' }).getByRole('link');
  await expect(links).toHaveCount(names.length);
  for (const [index, name] of names.entries()) await expect(links.nth(index)).toHaveAccessibleName(name);
}

test('FR-005: categories use direct placements, materials combine with other filters', async ({ page }, testInfo) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await openCatalog(page);
  await expect(page.getByLabel('Developmental category', { exact: true })).toBeVisible();
  const category = page.getByLabel('Developmental category', { exact: true });
  const material = page.getByLabel('Materials', { exact: true });
  await expect(category.locator('option')).toHaveText(['All categories', 'Fictional category', 'Second fictional category']);
  await expect(material.locator('option').filter({ hasText: /^Fictional material$/ })).toHaveCount(1);
  await category.selectOption({ label: 'Second fictional category' });
  await apply(page);
  await expectActivities(page, ['Fictional shared activity', 'Fictional second activity', 'Fictional cloth activity', 'Fictional no-skill activity']);
  await material.selectOption({ label: 'Fictional cloth' });
  await apply(page);
  await expectActivities(page, ['Fictional cloth activity', 'Fictional no-skill activity']);
  await page.getByLabel('Filter age in months').fill('7');
  await page.getByRole('button', { name: 'Second fictional skill', exact: true }).click();
  await expectActivities(page, ['Fictional cloth activity']);
  await expect(page.getByText('Materials: Fictional cloth', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('combined-filters.png'), fullPage: true });
  await page.getByRole('link', { name: 'Fictional cloth activity', exact: true }).click();
  await page.getByRole('link', { name: 'Back to activity library', exact: true }).click();
  await expect(category).toHaveValue('category-second');
  await expect(material.locator('option:checked')).toHaveText('Fictional cloth');
  await expect(page.getByLabel('Filter age in months')).toHaveValue('7');
  await expect(page.getByRole('button', { name: 'Second fictional skill', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Search by keyword').fill('paper');
  await apply(page);
  await expect(page.getByRole('heading', { name: 'No activities match.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(category).toHaveValue('');
  await expect(material).toHaveValue('');
  await expectActivities(page, ['Fictional shared activity', 'Fictional second activity', 'Fictional cloth activity', 'Fictional paper activity', 'Fictional no-skill activity']);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4174/') && !url.includes('?'))).toBe(true);
});

test('FR-005: explicit empty materials, exact membership and no inferred skill tags', async ({ page }) => {
  await openCatalog(page);
  const material = page.getByLabel('Materials', { exact: true });
  await material.selectOption({ label: 'No materials listed' });
  await apply(page);
  await expectActivities(page, ['Fictional shared activity']);
  await material.selectOption({ label: 'Fictional material' });
  await apply(page);
  await expectActivities(page, ['Fictional second activity', 'Fictional cloth activity']);
  await page.getByRole('button', { name: 'Fictional skill', exact: true }).click();
  await expectActivities(page, []);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.reload();
  await expect(material).toHaveValue('');
  await expect(page.getByLabel('Developmental category', { exact: true })).toHaveValue('');
});

test('FR-014: new filter controls support keyboard and narrow enlarged text', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await openCatalog(page);
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  const category = page.getByLabel('Developmental category', { exact: true });
  await category.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Materials', { exact: true })).toBeFocused();
  await apply(page);
  await expectActivities(page, ['Fictional shared activity', 'Fictional second activity', 'Fictional paper activity']);
  await expect(page.getByText('Category: Fictional category', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('filters-enlarged.png'), fullPage: true });
});

test('FR-005: literal material labels and applied filters survive navigation and invalid drafts', async ({ page }) => {
  // Regression cases independently derived by the reviewer from the requirements.
  const catalog = discoveryCatalog();
  const specialMaterial = 'none <cloth> "quoted" & string';
  catalog.activities.find(item => item.id === 'activity-cloth').materials.push(specialMaterial);
  catalog.activities.find(item => item.id === 'activity-paper').materials.push('none');
  await openCatalog(page, catalog);
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await page.getByLabel('Age in months', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await expect(page.getByLabel('Filter age in months')).toHaveValue('');
  await page.getByLabel('Developmental category', { exact: true }).selectOption('category-second');
  const material = page.getByLabel('Materials', { exact: true });
  await material.selectOption({ label: specialMaterial });
  await apply(page);
  await expectActivities(page, ['Fictional cloth activity']);
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await expect(material.locator('option:checked')).toHaveText(specialMaterial);
  await page.getByLabel('Filter age in months').fill('-1');
  await material.selectOption({ label: 'none' });
  await apply(page);
  await expect(page.getByLabel('Filter age in months')).toHaveAttribute('aria-invalid', 'true');
  await expectActivities(page, ['Fictional cloth activity']);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await material.selectOption({ label: 'none' });
  await apply(page);
  await expectActivities(page, ['Fictional paper activity']);
  await material.selectOption({ label: 'No materials listed' });
  await apply(page);
  await expectActivities(page, ['Fictional shared activity']);
  expect((await page.request.get('/e2e/fixtures/discovery-catalog.js')).status()).toBe(404);
});
