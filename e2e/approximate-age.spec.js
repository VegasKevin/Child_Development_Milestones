import { test, expect } from '@playwright/test';
import { discoveryCatalog } from './fixtures/discovery-catalog.js';
import { validateCatalog } from '../src/catalog.js';

function intervalCatalog() {
  const catalog = discoveryCatalog();
  catalog.activities[2].suitability = { minMonths: 2, maxMonths: 5 };
  catalog.links.find(link => link.activityId === 'activity-cloth').milestoneId = 'milestone-4';
  catalog.activities[3].suitability = { minMonths: 6, maxMonths: 10 };
  catalog.activities[4].suitability = { minMonths: 5, maxMonths: 6 };
  Object.assign(catalog.activities[0], { durationMinutes: 5, setting: 'indoor' });
  Object.assign(catalog.activities[4], { durationMinutes: 10, setting: 'either' });
  const checkpointActivity = { ...structuredClone(catalog.activities[1]),
    id: 'activity-four', title: 'Fictional four-month activity', suitability: { checkpointIds: ['checkpoint-4'] } };
  catalog.activities.push(checkpointActivity);
  catalog.links.push({ milestoneId: 'milestone-4', activityId: checkpointActivity.id, position: 100, reviewDate: '2025-12-15' });
  validateCatalog(catalog);
  return catalog;
}

async function open(page) {
  await page.route('**/fixtures/guide-catalog.js', route => route.fulfill({
    contentType: 'text/javascript', body: `export const guideCatalog = ${JSON.stringify(intervalCatalog())};`,
  }));
  await page.goto('/');
  await page.getByRole('link', { name: 'Search', exact: true }).click();
}

async function apply(page) {
  await page.getByRole('button', { name: 'Search activities', exact: true }).click();
}

async function range(page, youngest, oldest) {
  await page.getByLabel('Youngest possible age in months', { exact: true }).fill(String(youngest));
  await page.getByLabel('Oldest possible age in months', { exact: true }).fill(String(oldest));
  await apply(page);
}

async function expectResults(page, titles) {
  const results = page.getByRole('list', { name: 'Activity results' }).getByRole('link');
  await expect(results).toHaveCount(titles.length);
  for (const [index, title] of titles.entries()) await expect(results.nth(index)).toHaveAccessibleName(title);
}

test('DM-003/004: approximate discovery uses whole ranges and the younger checkpoint', async ({ page }, testInfo) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await open(page);
  const approximate = page.getByRole('checkbox', { name: 'Use an approximate age range', exact: true });
  await expect(approximate).toBeVisible();
  await approximate.check();
  await range(page, 5, 6);
  await expectResults(page, ['Fictional shared activity', 'Fictional no-skill activity', 'Fictional four-month activity']);
  await expect(page.getByText('Approximate age: 5 to 6 months', { exact: true })).toBeVisible();
  await expect(page.getByText('Checkpoint-based activities use Fictional 4-month checklist.', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('approximate-age.png'), fullPage: true });
  await page.getByRole('link', { name: 'Fictional four-month activity', exact: true }).click();
  await page.goBack();
  await expect(approximate).toBeChecked();
  await expect(page.getByLabel('Youngest possible age in months', { exact: true })).toHaveValue('5');
  await expect(page.getByLabel('Oldest possible age in months', { exact: true })).toHaveValue('6');
  await page.getByLabel('Time available', { exact: true }).selectOption('5');
  await page.getByLabel('Activity setting', { exact: true }).selectOption('indoor');
  await page.getByRole('button', { name: 'Fictional skill', exact: true }).click();
  await expectResults(page, ['Fictional shared activity']);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4174/') && !url.includes('?'))).toBe(true);
});

test('DM-003: interval endpoints are inclusive and partial overlaps do not match', async ({ page }) => {
  await open(page);
  await page.getByRole('checkbox', { name: 'Use an approximate age range', exact: true }).check();
  for (const [youngest, oldest, titles] of [
    [5, 5, ['Fictional shared activity', 'Fictional cloth activity', 'Fictional no-skill activity', 'Fictional four-month activity']],
    [6, 6, ['Fictional shared activity', 'Fictional second activity', 'Fictional paper activity', 'Fictional no-skill activity']],
    [4, 6, ['Fictional shared activity', 'Fictional four-month activity']],
    [6, 7, ['Fictional shared activity', 'Fictional second activity', 'Fictional paper activity']],
    [1, 2, []], [60, 61, []], [72, 73, []],
  ]) {
    await range(page, youngest, oldest);
    await expectResults(page, titles);
  }
});

test('FR-001/005: invalid ranges preserve applied results and exact mode clears the upper bound', async ({ page }) => {
  await open(page);
  const approximate = page.getByRole('checkbox', { name: 'Use an approximate age range', exact: true });
  await approximate.check();
  await range(page, 5, 6);
  for (const [youngest, oldest, message] of [
    [6, 5, 'The oldest possible age must be at least the youngest.'],
    [5, '', 'Enter both ends of the approximate age range.'],
    ['2.5', 6, 'Enter whole numbers of months, zero or above.'],
    [5, '9007199254740992', 'Enter whole numbers of months, zero or above.'],
  ]) {
    await range(page, youngest, oldest);
    await expect(page.getByRole('alert')).toHaveText(message);
    await expectResults(page, ['Fictional shared activity', 'Fictional no-skill activity', 'Fictional four-month activity']);
  }
  await approximate.uncheck();
  await page.getByLabel('Filter age in months', { exact: true }).fill('5');
  await apply(page);
  await expectResults(page, ['Fictional shared activity', 'Fictional cloth activity', 'Fictional no-skill activity', 'Fictional four-month activity']);
  await expect(page.getByText('Approximate age: 5 to 6 months', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(approximate).not.toBeChecked();
  await expect(page.getByLabel('Oldest possible age in months', { exact: true })).toBeHidden();
  await expect(page.getByRole('list', { name: 'Activity results' }).getByRole('link')).toHaveCount(6);
});

test('FR-014: interval controls support keyboard, enlarged text and reload reset', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await open(page);
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  await page.getByLabel('Filter age in months', { exact: true }).fill('5');
  const approximate = page.getByRole('checkbox', { name: 'Use an approximate age range', exact: true });
  await approximate.focus();
  await page.keyboard.press('Space');
  await page.getByLabel('Oldest possible age in months', { exact: true }).focus();
  await page.keyboard.type('6');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeFocused();
  await expect(page.getByText('Approximate age: 5 to 6 months', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('approximate-age-enlarged.png'), fullPage: true });
  await page.reload();
  await expect(approximate).not.toBeChecked();
  await expect(page.getByLabel('Filter age in months', { exact: true })).toHaveValue('');
});

test('DM-003: reviewer zero-boundary, every-filter, draft-discard and privacy regression', async ({ page }) => {
  const catalog = discoveryCatalog();
  Object.assign(catalog.activities[2], { suitability: { minMonths: 0, maxMonths: 71 }, durationMinutes: 3, setting: 'either' });
  validateCatalog(catalog);
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.route('**/fixtures/guide-catalog.js', route => route.fulfill({
    contentType: 'text/javascript', body: `export const guideCatalog = ${JSON.stringify(catalog)};`,
  }));
  await page.goto('/');
  await page.getByLabel('Age in months', { exact: true }).fill('7');
  await page.getByRole('button', { name: 'Browse milestones', exact: true }).click();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  const approximate = page.getByRole('checkbox', { name: 'Use an approximate age range', exact: true });
  await approximate.check();
  await page.getByLabel('Youngest possible age in months', { exact: true }).fill('0');
  await page.getByLabel('Oldest possible age in months', { exact: true }).fill('71');
  await page.getByLabel('Search by keyword').fill('cloth');
  await page.getByLabel('Developmental category').selectOption('category-second');
  await page.getByLabel('Materials', { exact: true }).selectOption({ label: 'Fictional cloth' });
  await page.getByLabel('Time available').selectOption('3');
  await page.getByLabel('Activity setting').selectOption('outdoor');
  await page.getByRole('button', { name: 'Second fictional skill', exact: true }).click();
  await expectResults(page, ['Fictional cloth activity']);
  await expect(page.getByText('No applicable checklist at the younger age.', { exact: true })).toBeVisible();
  for (const [youngest, oldest] of [['', '71'], ['-1', '71'], ['0', '-1']]) {
    await range(page, youngest, oldest);
    await expect(page.getByRole('alert')).not.toBeEmpty();
    await expectResults(page, ['Fictional cloth activity']);
    await expect(page.getByText('Approximate age: 0 to 71 months', { exact: true })).toBeVisible();
  }
  await approximate.uncheck();
  await page.getByRole('link', { name: 'Fictional cloth activity', exact: true }).click();
  await page.getByRole('link', { name: 'Back to activity library', exact: true }).click();
  await expect(approximate).toBeChecked();
  await expect(page.getByLabel('Youngest possible age in months', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Oldest possible age in months', { exact: true })).toHaveValue('71');
  await page.getByRole('link', { name: 'Milestones', exact: true }).click();
  await expect(page.getByLabel('Age in months', { exact: true })).toHaveValue('7');
  await expect(page.getByRole('heading', { name: '6 months', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  expect(await page.evaluate(async () => ({ local: localStorage.length, session: sessionStorage.length,
    databases: (await indexedDB.databases()).length }))).toEqual({ local: 0, session: 0, databases: 0 });
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4174/') && !url.includes('?'))).toBe(true);
});
