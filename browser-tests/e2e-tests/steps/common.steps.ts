import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/bdd-fixtures';

const { When, Then } = createBdd(test);

// Shared location-related steps
// Matches: "I select I am from the UK" and "user selects they are from the UK"
When(/^(?:user selects|I select) (?:I am |they are )?from the UK$/, async ({ identityPage }) => {
  await identityPage.selectUKLocation();
});

// Shared address stub steps - F2F format
When('I enter address stub data and submit', async ({ addressPage }) => {
  await addressPage.processKennethDecerqueiraValidAddress();
});

// Shared address stub steps - E2E format
When('user enters data in address stub and clicks on submit data and generate auth code', async ({ addressPage, page }) => {
  const currentUrl = page.url();

  // Check if we're on an error page
  if (currentUrl.includes('pyi-no-match')) {
    throw new Error('Passport submission resulted in pyi-no-match error page. The passport credential data may be invalid or not configured for this journey type.');
  }

  // If we're not already on address stub, wait for navigation to it
  if (!currentUrl.includes('address')) {
    await page.waitForURL(/address/, { timeout: 30000 });
  }

  await addressPage.processKennethDecerqueiraValidAddress();
});

// Shared fraud stub steps - F2F format
When('I enter fraud build stub data and submit', async ({ fraudPage }) => {
  await fraudPage.processKennethDecerqueiraFraud();
});

// Shared fraud stub steps - E2E format
When('user enters data in fraud build stub and clicks on submit data and generate auth code', async ({ fraudPage, page }) => {
  const currentUrl = page.url();

  // If we're not already on fraud stub, wait for navigation to it
  if (!currentUrl.includes('fraud')) {
    await page.waitForURL(/fraud/, { timeout: 30000 });
  }

  await fraudPage.processKennethDecerqueiraFraud();
});

// PIP (Personal Independence Payment) page step
// Selenium uses CommonElements.selectRadioOption(optionNumber, pageId) which maps to
// #journey (option 1), #journey-2 (option 2), etc.
Then('the user should land onto the PIP page and select {string} and continue', async ({ page }, choice: string) => {
  // Verify we're on the PIP page (normalise smart quotes from GDS)
  const h1Text = await page.locator('h1').first().textContent({ timeout: 10000 });
  const normalise = (s: string) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  expect(normalise((h1Text || '').trim())).toBe('Tell us if you get Personal Independence Payment (PIP)');

  // 'yes' = #journey (option 1), 'no' = #journey-2 (option 2)
  if (choice.toLowerCase() === 'yes') {
    await page.locator('#journey').click({ force: true });
  } else {
    await page.locator('#journey-2').click({ force: true });
  }

  const continueButton = page.locator('#continue, #submitButton, button[type="submit"], button:has-text("Continue")').first();
  await continueButton.click();
});
