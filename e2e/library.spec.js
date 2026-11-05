import { test, expect } from '@playwright/test';

async function search(page, { query = '', age = '' } = {}) {
  await page.getByLabel('Search by keyword').fill(query);
  await page.getByLabel('Filter age in months').fill(String(age));
  await page.getByRole('button', { name: 'Search activities', exact: true }).click();
}

test('FR-004/005: standalone discovery, metadata filters and return to results', async ({ page }, testInfo) => {
  const requests = [];
  const errors = [];
  page.on('request', request => requests.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Activity library', exact: true })).toBeVisible();
  const results = page.getByRole('list', { name: 'Activity results' }).getByRole('link');
  await expect(results).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('library.png'), fullPage: true });
  await search(page, { query: '  SECOND  ', age: 7 });
  await expect(results).toHaveCount(1);
  await page.getByRole('link', { name: 'Fictional second activity', exact: true }).click();
  await expect(page.getByText('Fictional warning.', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel('Search by keyword')).toHaveValue('  SECOND  ');
  await expect(page.getByLabel('Filter age in months')).toHaveValue('7');
  await expect(results).toHaveCount(1);
  await page.getByRole('button', { name: 'Fictional skill', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No activities match.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Fictional skill', exact: true }).click();
  await expect(results).toHaveCount(1);
  await expect(results.first()).toHaveAccessibleName('Fictional shared activity');
  await page.getByRole('button', { name: 'Fictional skill', exact: true }).click();
  await expect(results).toHaveCount(2);
  await search(page, { query: 'Fictional material' });
  await expect(results).toHaveCount(1);
  await expect(results.first()).toHaveAccessibleName('Fictional second activity');
  await expect(page.getByRole('status')).toContainText('1 activity');
  expect(errors).toEqual([]);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4174/') && !url.includes('?'))).toBe(true);
});

test('DM-003: month ranges and checkpoint suitability use different age rules', async ({ page }) => {
  await page.goto('/#/library');
  const results = page.getByRole('list', { name: 'Activity results' }).getByRole('link');
  for (const [age, count] of [[1, 0], [2, 1], [6, 2], [7, 2], [60, 1], [61, 0], [72, 0]]) {
    await search(page, { age });
    await expect(results).toHaveCount(count);
  }
  await search(page, { age: -1 });
  await expect(page.getByRole('alert')).toHaveText('Enter a whole number of months, zero or above, or leave age blank.');
  await expect(page.getByLabel('Filter age in months')).toBeFocused();
  await search(page, { age: '2.5' });
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(results).toHaveCount(2);
});

test('FR-014: library keyboard, enlarged text and standalone detail reload', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/#/library');
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  await page.getByLabel('Search by keyword').focus();
  await page.keyboard.type('second');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('library-enlarged.png'), fullPage: true });
  await page.getByRole('link', { name: 'Fictional second activity', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fictional second activity', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to activity library', exact: true }).click();
  await expect(page.getByLabel('Search by keyword')).toHaveValue('');
  await expect(page.getByRole('list', { name: 'Activity results' }).getByRole('link')).toHaveCount(2);
});
