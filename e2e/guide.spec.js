import { test, expect } from '@playwright/test';

async function browse(page, age) {
  await page.getByLabel('Age in months').fill(String(age));
  await page.getByRole('button', { name: 'Browse milestones' }).click();
}

async function orderedActivities(page, titles) {
  const links = page.getByRole('list', { name: 'Linked activities' }).getByRole('link');
  await expect(links).toHaveCount(titles.length);
  for (const [index, title] of titles.entries()) await expect(links.nth(index)).toHaveAccessibleName(title);
}

test('FR-001/002/004: age to category, milestone and ordered activity details', async ({ page }, testInfo) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Milestones', exact: true })).toBeVisible();
  await expect(page.getByText('Fictional demo content. Not developmental guidance.', { exact: true })).toBeVisible();
  await browse(page, 7);
  await expect(page.getByRole('heading', { name: 'Fictional 6-month checklist', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('checklist.png'), fullPage: true });
  await page.getByRole('link', { name: /Fictional category/ }).click();
  await page.getByRole('link', { name: 'Fictional behavior 6.', exact: true }).click();
  await expect(page.getByText('Fictional example.', { exact: true })).toBeVisible();
  await orderedActivities(page, ['Fictional shared activity', 'Fictional second activity']);
  await page.getByRole('link', { name: 'Fictional second activity', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Materials', exact: true })).toBeVisible();
  await expect(page.getByText('Fictional material', { exact: true })).toBeVisible();
  await expect(page.getByText('Another fictional instruction for software testing only.', { exact: true })).toBeVisible();
  await expect(page.getByText('Fictional warning.', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('activity.png'), fullPage: true });
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Fictional behavior 6.', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to category' }).click();
  await page.getByRole('link', { name: 'Fictional behavior 6-other.', exact: true }).click();
  await orderedActivities(page, ['Fictional second activity', 'Fictional shared activity']);
  expect(errors).toEqual([]);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4174/'))).toBe(true);
  expect(requests.some(url => /[?&](age|months)=/.test(url))).toBe(false);
});

test('DM-A01/A08: coverage messages and explicit optional preview', async ({ page }) => {
  await page.goto('/');
  await browse(page, 1);
  await expect(page.getByText('Checklist coverage begins at 2 months.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Fictional category/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview the 2-month checklist' }).click();
  await expect(page.getByRole('heading', { name: '2-month checklist preview', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Fictional category/ }).click();
  await page.getByRole('link', { name: 'Fictional behavior 2.', exact: true }).click();
  await expect(page.getByText('2-month checklist preview', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Change age' }).click();
  await browse(page, 72);
  await expect(page.getByText('Checklist coverage ends at 72 months.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Fictional category/ })).toHaveCount(0);
  await browse(page, 71);
  await expect(page.getByRole('heading', { name: 'Fictional 60-month checklist', exact: true })).toBeVisible();
});

test('invalid input stays actionable and temporary age resets on reload', async ({ page }) => {
  await page.goto('/');
  for (const age of ['', '-1', '2.5']) {
    await browse(page, age);
    await expect(page.getByRole('alert')).toHaveText('Enter a whole number of months, zero or above.');
    await expect(page.getByLabel('Age in months')).toHaveAttribute('aria-invalid', 'true');
  }
  await browse(page, 6);
  await page.reload();
  await expect(page.getByLabel('Age in months')).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Start with an age.', exact: true })).toBeVisible();
});

test('FR-014: narrow enlarged text and keyboard navigation', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  await page.getByLabel('Age in months').focus();
  await page.keyboard.type('6');
  await page.keyboard.press('Enter');
  const category = page.getByRole('link', { name: /Fictional category/ });
  await category.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Fictional category', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Fictional behavior 6.', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional second activity', exact: true }).click();
  await expect(page.getByText('Fictional warning.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('enlarged-activity.png'), fullPage: true });
  const url = page.url();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  expect(page.url()).toBe(url);
});

test('details remain scoped to the selected checklist and recover after reload', async ({ page }) => {
  await page.goto('/');
  await browse(page, 2);
  await page.getByRole('link', { name: /Fictional category/ }).click();
  await expect(page.getByRole('link', { name: 'Fictional behavior 6.', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Fictional behavior 2.', exact: true }).click();
  await page.getByRole('link', { name: 'Fictional shared activity', exact: true }).click();
  await expect(page.getByText('No materials listed.', { exact: true })).toBeVisible();
  await expect(page.getByText('Listed for: 2 to 60 months', { exact: true })).toBeVisible();
  await page.goto('/#/milestone/milestone-6');
  await expect(page.getByRole('heading', { name: 'Page unavailable', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to milestones' }).click();
  await browse(page, 6);
  await page.getByRole('link', { name: /Fictional category/ }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Page unavailable', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to milestones' }).click();
  await expect(page.getByLabel('Age in months')).toHaveValue('');
});
