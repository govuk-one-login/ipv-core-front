import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/bdd-fixtures';
import { BddContext } from './bdd-context';

const { When, Then } = createBdd(test);

When('user starts a fresh full journey in {string}', async ({ orchestratorPage }, _env: string) => {
  await orchestratorPage.navigate();
  const userId = await orchestratorPage.getUserId();
  expect(userId).toBeTruthy();
  BddContext.set('userId', userId);
  await orchestratorPage.startFullJourney();
});

When("the {string} feature set is enabled", async ({ identityPage }, featureSet: string) => {
  await identityPage.enableFeatureFlags(featureSet);
});

When('clicks continue on the signed into your GOV.UK One Login page in build stub', async ({ page }) => {
  // Validate language toggle is present
  const langToggle = page.locator('a, button').filter({ hasText: /English|Cymraeg/ });
  await langToggle.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  // Select "Yes" for photo ID question
  const firstRadio = page.locator('input[type="radio"]').first();
  await firstRadio.check();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.waitForLoadState('networkidle');

  // On DOC Checking App (Stub) page — generate OAuth error
  await page.locator('#tab_oauthError').click();
  await page.locator('#endpoint').click();
  await page.locator('#requested_oauth_error').selectOption('access_denied');
  await page.locator('[name="submit"]').click();
  await page.waitForLoadState('networkidle');

  // Check language cookie and select appropriate document option
  const cookies = await page.context().cookies();
  const lngCookie = cookies.find(c => c.name === 'lng')?.value || 'en';

  if (lngCookie === 'cy') {
    const welshPassportRadio = page.locator('input[type="radio"]').filter({
      has: page.locator('label').filter({ hasText: /Welsh Passport|Pasbort Cymru/ })
    }).first();
    const welshRadioVisible = await welshPassportRadio.isVisible({ timeout: 3000 }).catch(() => false);
    if (welshRadioVisible) {
      await welshPassportRadio.check();
    }
  } else {
    // English path: select second radio option (Passport)
    const allRadios = page.locator('input[type="radio"]');
    const radioCount = await allRadios.count();
    if (radioCount >= 2) {
      await allRadios.nth(1).check();
    }
  }

  await page.getByRole('button', { name: /Continue/ }).click();
  await page.waitForLoadState('networkidle');
});

When('user enters the data in Passport stub as a PassportSubject', async ({ passportPage, page }) => {
  await passportPage.selectTestDataAndSubmit('Kenneth Decerqueira (Valid Experian) Passport');

  const afterUrl = page.url();
  if (afterUrl.includes('pyi-no-match')) {
    console.error('[E2E Passport] Passport submission led to pyi-no-match error page');
  }
});

Then('user should be on Fraud Check \\(Stub)', async ({ page }) => {
  await expect(page.locator('h1, [role="heading"]').first()).toContainText('Fraud Check', { timeout: 10000 });
});

Then('User should be on KBV page and click continue', async ({ page }) => {
  await expect(page.locator('h1, [role="heading"]').first()).toContainText('Answer security questions', { timeout: 10000 });
  // Selenium uses #submitButton (CONTINUE_BUTTON_DESIGN_SYSTEM) on this page
  const continueButton = page.locator('#submitButton, #continue, button[type="submit"]').first();
  await continueButton.click();
});

When('user enters data in kbv stub and clicks on submit data and generate auth code', async ({ kbvPage }) => {
  await kbvPage.fillAndSubmit('Kenneth Decerqueira (Valid Experian) KBV', '2');
});

Then('user should be successful in proving identity', async ({ page }) => {
  await expect(page.locator('h1, [role="heading"]')).toContainText('Continue to the service you need to use', { timeout: 10000 });
});

Then('User should be able to see the json response page', async ({ page }) => {
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByText('Raw User Info Object')).toBeVisible({ timeout: 10000 });
});

Then("'vot' should be set to {string} in the raw user info object", async ({ page }, votValue: string) => {
  await expect(page.locator('#main-content').first()).toContainText(votValue, { timeout: 10000 });
});

When('user starts a new full journey with the same userId in {string}', async ({ orchestratorPage }, _env: string) => {
  const userId = BddContext.get('userId');
  await orchestratorPage.navigate();
  await orchestratorPage.setUserId(userId);
  await orchestratorPage.startFullJourney();
});

Then('the user should be taken to the IPV Reuse Screen with One login changes', async ({ identityPage }) => {
  await identityPage.expectReuseScreenForKenneth();
});

Then('Relevant changes for VOT displayed in JSONResponse', async ({ page }) => {
  // Selenium: clickContinue() — clicks #submitButton and waits for new page
  await page.locator('#submitButton').click();
  await page.waitForLoadState('networkidle');

  // Selenium: assertEquals("Raw User Info Object", RAW_JSON.getText())
  await expect(page.locator('span').filter({ hasText: 'Raw User Info Object' }).first()).toBeVisible({ timeout: 10000 });

  // Selenium: clickElement(RAW_USER_OBJ) — clicks the <summary> to expand <details>
  await page.locator('details summary').first().click();

  // Wait for details content to expand and become visible
  await expect(page.locator('details[open]').first()).toBeVisible({ timeout: 5000 });

  // Verify VOT is displayed as P2
  await expect(page.getByText(/P2/).first()).toBeVisible({ timeout: 10000 });
});
