import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/bdd-fixtures';
import { BddContext } from './bdd-context';

const { When, Then, Given } = createBdd(test);

// --- Page heading and text assertions ---

Then('the user should see a page with heading {string}', async ({ page }, heading: string) => {
  // Normalise smart quotes: GDS pages use curly apostrophes, feature files use straight ones.
  const normalise = (s: string) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const h1Text = await page.locator('h1').first().textContent({ timeout: 10000 });
  const actual = normalise((h1Text || '').trim());
  const expected = normalise(heading.trim());
  expect(actual).toBe(expected);
});

Then('the user should see text {string} by {int} seconds', async ({ page }, text: string, timeout: number) => {
  // Mirrors Selenium ExpectedConditions.presenceOfElementLocated — checks the element
  // is in the DOM, not necessarily visible (page may toggle visibility via JS).
  const locator = page.locator(`//*[contains(text(),"${text}")]`).first();
  await expect(locator).toBeAttached({ timeout: timeout * 1000 });
});

// --- Radio selection and continue ---

When('clicks {string} radio, then continue', async ({ page }, value: string) => {
  // Mirrors Selenium ByAll: tries input[@value] first, then label containing text.
  // Uses click on the label (not check on radio) since radios may be visually hidden
  // and styled via the label in GDS patterns.
  // Also normalises smart quotes to handle curly apostrophes in page content.
  const radioByValue = page.locator(`input[value="${value}"]`);

  if (await radioByValue.isVisible({ timeout: 3000 }).catch(() => false)) {
    await radioByValue.click();
  } else {
    // Build a regex that matches both straight and curly apostrophes
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2019]");
    const labelByText = page.locator('label', { hasText: new RegExp(escapedValue) });
    await labelByText.first().click({ timeout: 10000 });
  }

  // Click continue button (mirrors the Selenium CONTINUE_BUTTON ByAll locator)
  const continueButton = page.locator('#continue, #submitButton, button[type="submit"], button[data-id="next"], button:has-text("Continue")').first();
  await continueButton.click();
});

// --- Continue button steps ---

Then('the continue button should be enabled within {int} seconds', async ({ page }, timeout: number) => {
  const continueButton = page.locator('#continue, #submitButton, button[type="submit"], button[data-id="next"], button:has-text("Continue")').first();
  await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
});

When('the user clicks on the Continue button', async ({ page }) => {
  const continueButton = page.locator('#continue, #submitButton, button[type="submit"], button[data-id="next"], button:has-text("Continue")').first();
  await continueButton.click();
});

// --- DCMAW CRI async VC production ---

When(
  'the DCMAW CRI produces a {string} {string} {string} VC',
  async ({ dcmawAsyncService }, testUser: string, documentType: string, evidenceType: string) => {
    const userId = BddContext.get('userId');
    console.log(`[StrategicApp] Enqueuing DCMAW VC for user ${userId}: ${testUser} ${documentType} ${evidenceType}`);
    const oauthState = await dcmawAsyncService.enqueueVc(userId, testUser, documentType, evidenceType);
    BddContext.set('oauthState', oauthState);
    console.log(`[StrategicApp] ✓ DCMAW VC enqueued, oauthState: ${oauthState}`);
  },
);

// --- MAM callback from mobile app ---

When('user returns from the app to core-front', async ({ page }) => {
  const currentUrl = new URL(page.url());
  const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
  const oauthState = BddContext.get('oauthState');

  const callbackUrl = `${baseUrl}/app/callback?state=${oauthState}`;
  console.log(`[StrategicApp] Navigating to app callback: ${callbackUrl}`);
  await page.goto(callbackUrl);
  console.log('[StrategicApp] ✓ Returned from app to core-front');
});

// --- Stub evidence submission ---

When('submits {string} evidence', async ({ page }, name: string) => {
  await selectUserAndSubmit(page, name);
});

When('submits {string} evidence with scores', async ({ page }, name: string, dataTable: any) => {
  const rows: string[][] = dataTable.rows();
  const scores: Record<string, string> = {};
  for (const [attribute, value] of rows) {
    scores[attribute.trim().toLowerCase()] = value.trim();
  }

  // Select test data
  await page.waitForSelector('#test_data', { timeout: 30000 });
  const select = page.locator('#test_data');
  // Find the option that starts with the given name
  const options = await select.locator('option').allTextContents();
  const matchingOption = options.find((opt) => opt.startsWith(name));
  if (!matchingOption) {
    throw new Error(`No option found starting with "${name}" in #test_data`);
  }
  await select.selectOption(matchingOption);

  // Fill in score fields
  if (scores.strength) await page.locator('#strength').fill(scores.strength);
  if (scores.validity) await page.locator('#validity').fill(scores.validity);
  if (scores.activity) await page.locator('#activity, #activityHistory').first().fill(scores.activity);
  if (scores.verification) await page.locator('#verification').fill(scores.verification);
  if (scores.fraud) await page.locator('#fraud').fill(scores.fraud);
  if (scores.ci) await page.locator('#ci').fill(scores.ci);

  // Submit
  await page.locator('input[name="submit"]').click();
});

// --- Identity verification assertion ---

Then('user should have a {string} identity', async ({ page }, vot: string) => {
  // Verify success page
  await expect(page.locator('h1').first()).toContainText('Continue to the service you need to use', { timeout: 10000 });

  // Click continue to get to the JSON response page
  // Selenium CONTINUE_BUTTON = ByAll(#continue, #submitButton, button[type="submit"], ...)
  const continueBtn = page.locator('#continue, #submitButton, button[type="submit"]').first();
  const currentUrl = page.url();
  await continueBtn.click();
  await page.waitForURL((url: URL) => url.toString() !== currentUrl, { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Verify VOT in raw user info
  await expect(page.getByText('Raw User Info Object').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#main-content').first()).toContainText(vot, { timeout: 10000 });
  console.log(`[StrategicApp] ✓ User identity verified as ${vot}`);
});

// --- Helper ---

async function selectUserAndSubmit(page: any, name: string): Promise<void> {
  await page.waitForSelector('#test_data', { timeout: 30000 });
  const select = page.locator('#test_data');
  const options = await select.locator('option').allTextContents();
  const matchingOption = options.find((opt: string) => opt.startsWith(name));
  if (!matchingOption) {
    throw new Error(`No option found starting with "${name}" in #test_data`);
  }
  await select.selectOption(matchingOption);
  await page.locator('input[name="submit"]').click();
}
