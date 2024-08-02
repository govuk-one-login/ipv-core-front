const { test, expect } = require('@playwright/test');

test('example test', async ({ page }) => {
  await page.goto('http://localhost:4501/dev/template/page-ipv-identity-document-start/en');
  await expect(page).toHaveScreenshot();
});