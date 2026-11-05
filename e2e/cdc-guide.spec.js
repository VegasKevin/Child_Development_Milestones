import { test, expect } from '@playwright/test';

test('FR-002: the normal age-to-category route uses CDC milestone statements and direct sources', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', request => requestFailures.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto('/');
  await page.waitForTimeout(100);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(requestFailures).toEqual([]);
  await page.getByLabel('Age in months').fill('6');
  await page.getByRole('button', { name: 'Browse milestones' }).click();
  await page.getByRole('link', { name: /Social\/Emotional/ }).click();
  await page.getByRole('link', { name: 'Knows familiar people' }).click();
  await expect(page.getByRole('heading', { name: 'Knows familiar people', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the CDC 6 months checklist' }))
    .toHaveAttribute('href', 'https://www.cdc.gov/act-early/digital-online-checklist/6-months.html');
});
