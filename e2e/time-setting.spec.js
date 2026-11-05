import { test, expect } from '@playwright/test';
import { discoveryCatalog } from './fixtures/discovery-catalog.js';

function timedCatalog() {
  const catalog = discoveryCatalog();
  Object.assign(catalog.activities[0], { durationMinutes: 5, setting: 'indoor' });
  Object.assign(catalog.activities[1], { durationMinutes: 15, setting: 'outdoor' });
  Object.assign(catalog.activities[2], { durationMinutes: 10, setting: 'either' });
  catalog.activities[4].durationMinutes = 5;
  return catalog;
}

async function open(page, catalog = timedCatalog()) {
  await page.route('**/fixtures/guide-catalog.js', route => route.fulfill({
    contentType: 'text/javascript', body: `export const guideCatalog = ${JSON.stringify(catalog)};`,
  }));
  await page.goto('/');
  await page.getByRole('link', { name: 'Search', exact: true }).click();
}

async function apply(page) {
  await page.getByRole('button', { name: 'Search activities', exact: true }).click();
}

async function expectResults(page, titles) {
  const results = page.getByRole('list', { name: 'Activity results' }).getByRole('link');
  await expect(results).toHaveCount(titles.length);
  for (const [index, title] of titles.entries()) await expect(results.nth(index)).toHaveAccessibleName(title);
}

test('FR-005: time budget, location and missing metadata combine through normal discovery', async ({ page }, testInfo) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await open(page);
  const duration = page.getByLabel('Time available', { exact: true });
  const setting = page.getByLabel('Activity setting', { exact: true });
  await expect(duration).toBeVisible();
  await expect(duration.locator('option')).toHaveText(['Any duration', 'Up to 5 minutes', 'Up to 10 minutes', 'Up to 15 minutes']);
  await duration.selectOption({ label: 'Up to 5 minutes' });
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional no-skill activity']);
  await setting.selectOption({ label: 'Outdoors' });
  await apply(page);
  await expect(page.getByRole('heading', { name: 'No activities match.', exact: true })).toBeVisible();
  await duration.selectOption({ label: 'Up to 10 minutes' });
  await apply(page);
  await expectResults(page, ['Fictional cloth activity']);
  await page.getByLabel('Developmental category').selectOption('category-second');
  await page.getByLabel('Materials', { exact: true }).selectOption({ label: 'Fictional cloth' });
  await page.getByLabel('Filter age in months').fill('7');
  await page.getByLabel('Search by keyword').fill('cloth');
  await page.getByRole('button', { name: 'Second fictional skill', exact: true }).click();
  await expectResults(page, ['Fictional cloth activity']);
  await page.screenshot({ path: testInfo.outputPath('time-setting.png'), fullPage: true });
  await page.getByRole('link', { name: 'Fictional cloth activity', exact: true }).click();
  await expect(page.getByText('Duration: 10 minutes', { exact: true })).toBeVisible();
  await expect(page.getByText('Setting: Indoors or outdoors', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(duration).toHaveValue('10');
  await expect(setting).toHaveValue('outdoor');
  await expectResults(page, ['Fictional cloth activity']);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await setting.selectOption({ label: 'Indoors' });
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional cloth activity']);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await duration.selectOption({ label: 'Up to 15 minutes' });
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional second activity', 'Fictional cloth activity', 'Fictional no-skill activity']);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4174/') && !url.includes('?'))).toBe(true);
});

test('DM-003: absent optional metadata creates no options and is not inferred', async ({ page }) => {
  await open(page, discoveryCatalog());
  await expect(page.getByLabel('Time available', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Activity setting', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Fictional paper activity', exact: true }).click();
  await expect(page.getByText('Duration not listed.', { exact: true })).toBeVisible();
  await expect(page.getByText('Setting not listed.', { exact: true })).toBeVisible();
});

test('FR-014: time and setting controls remain usable with enlarged text and keyboard', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await open(page);
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  const duration = page.getByLabel('Time available', { exact: true });
  await duration.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Activity setting', { exact: true })).toBeFocused();
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional no-skill activity']);
  await expect(page.getByText('Time available: Up to 5 minutes', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('time-setting-enlarged.png'), fullPage: true });
  await page.reload();
  await expect(duration).toHaveValue('');
});

test('DM-003: malformed duration or setting blocks the entire catalog at the browser boundary', async ({ page }) => {
  for (const metadata of [{ durationMinutes: 0 }, { setting: 'both' }]) {
    const catalog = timedCatalog();
    Object.assign(catalog.activities[0], metadata);
    await page.route('**/fixtures/guide-catalog.js', route => route.fulfill({
      contentType: 'text/javascript', body: `export const guideCatalog = ${JSON.stringify(catalog)};`,
    }), { times: 1 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Demo content is unavailable', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Search', exact: true })).toHaveCount(0);
  }
});

test('FR-005: independent one-minute, either-only and asymmetric metadata regression', async ({ page }) => {
  const catalog = discoveryCatalog();
  Object.assign(catalog.activities[0], { durationMinutes: 1, setting: 'either' });
  catalog.activities[1].durationMinutes = Number.MAX_SAFE_INTEGER;
  catalog.activities[2].setting = 'either';
  await open(page, catalog);
  const duration = page.getByLabel('Time available', { exact: true });
  const setting = page.getByLabel('Activity setting', { exact: true });
  await expect(duration.locator('option')).toHaveText(['Any duration', 'Up to 1 minute', `Up to ${Number.MAX_SAFE_INTEGER} minutes`]);
  await expect(setting.locator('option')).toHaveText(['Any setting', 'Indoors', 'Outdoors']);
  await setting.selectOption('outdoor');
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional cloth activity']);
  await duration.selectOption('1');
  await apply(page);
  await expectResults(page, ['Fictional shared activity']);
  await duration.selectOption(String(Number.MAX_SAFE_INTEGER));
  await apply(page);
  await expectResults(page, ['Fictional shared activity']);
  await setting.selectOption('');
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional second activity']);
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await expect(page.getByText('Duration: 1 minute', { exact: true })).toBeVisible();
  await expect(page.getByText('Setting: Indoors or outdoors', { exact: true })).toBeVisible();
  await page.goBack();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await setting.selectOption('indoor');
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional cloth activity']);
});

test('FR-005: the ordinary local guide exposes its own example duration and setting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  const duration = page.getByLabel('Time available', { exact: true });
  const setting = page.getByLabel('Activity setting', { exact: true });
  await expect(duration.locator('option')).toHaveText(['Any duration', 'Up to 5 minutes', 'Up to 15 minutes']);
  await duration.selectOption('5');
  await setting.selectOption('outdoor');
  await apply(page);
  await expectResults(page, []);
  await setting.selectOption('indoor');
  await apply(page);
  await expectResults(page, ['Fictional shared activity']);
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await expect(page.getByText('Duration: 5 minutes', { exact: true })).toBeVisible();
  await expect(page.getByText('Setting: Indoors', { exact: true })).toBeVisible();
});
