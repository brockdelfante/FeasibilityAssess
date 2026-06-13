import { test, expect } from '@playwright/test';

test('Full Assessment Life-cycle', async ({ page }) => {
  test.setTimeout(120000);

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3000');

  console.log('Waiting for "New Assessment" button...');
  await page.waitForSelector('text=New Assessment', { timeout: 30000 });

  console.log('Starting wizard...');
  await page.click('text=New Assessment');
  await page.waitForURL(/.*\/deals\/new/);

  console.log('Wizard Step 1...');
  await page.click('text=Next');

  console.log('Wizard Step 2...');
  await page.fill('#group-input', 'Test Automation Group');
  await page.fill('#address-input', '123 Playwright Lane, Brisbane QLD');
  await page.click('text=Next');

  console.log('Wizard Step 3...');
  await page.click('text=Create Assessment');

  console.log('Waiting for redirect to edit page...');
  await page.waitForURL(/.*\/deals\/.*\/edit/, { timeout: 45000 });

  await page.waitForSelector('text=Live Analysis Engine', { timeout: 30000 });

  console.log('Filling feasibility data...');
  await page.fill('#site-value-input', '5000000');
  await page.fill('#construction-cost-input', '8000000');

  console.log('Updating existing product...');
  const productRow = page.locator('div.group', { has: page.locator('input[value="Example Lot"]') });
  await productRow.locator('input[type="number"]').nth(2).fill('15000000');

  console.log('Verifying calculations...');
  await page.waitForTimeout(3000);

  const rocValue = await page.locator('span.font-mono.font-black').first().textContent();
  console.log('Calculated ROC:', rocValue);
  expect(rocValue).not.toBe('0.0%');

  console.log('Saving draft...');
  const dialogPromise = page.waitForEvent('dialog');
  await page.click('text=Commit Draft');
  const dialog = await dialogPromise;
  console.log('Alert message:', dialog.message());
  expect(dialog.message()).toContain('Draft committed');
  await dialog.accept();

  console.log('Checking Action Bar buttons...');
  await expect(page.locator('text=Push dfs')).toBeVisible();
  await expect(page.locator('text=Push advisory')).toBeVisible();
  await expect(page.locator('text=Generate Reports')).toBeVisible();

  console.log('Workflow verification complete.');
});
