import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/bdd-fixtures';
import { BddContext } from './bdd-context';

const { Given, When, Then } = createBdd(test);

// Note: "I select I am from the UK" is now defined in common.steps.ts

When('I confirm I do not have photo ID suitable for an app journey', async ({ identityPage }) => {
  await identityPage.selectNoPhotoID();
});

Then('I should see page with heading {string}', async ({ page }, heading: string) => {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
});

When('I select Yes radio and continue', async ({ identityPage }) => {
  await identityPage.selectYesPhotoID();
});

When('I enter CIC stub data as Kenneth Decerqueira', async ({ cicPage }) => {
  await cicPage.selectTestData('Kenneth Decerqueira');
  await cicPage.submitData();
});

// Note: address and fraud steps are now consolidated in common.steps.ts

When('I enter Face to Face Stub data for valid passport and submit', async ({ f2fPage }) => {
  await f2fPage.processKennethDecerqueiraF2F();
});

Then('I should see go to post office page without VC', async ({ identityPage }) => {
  await identityPage.expectPostOfficeHeading();
  BddContext.set('waitingForF2FAsync', true);
});

Then(
  'After User relogin should see passport and identity claim data in Raw User Info Object',
  async ({ page, orchestratorPage, identityPage }) => {
    const userId = BddContext.get('userId');
    const startTime = Date.now();
    const maxWaitMs = 20000; // 20 second timeout
    const retryIntervalMs = 2000; // Retry every 2 seconds
    let lastError: Error | null = null;

    console.log('[F2F Step] Starting retry loop for async F2F processing...');

    while (Date.now() - startTime < maxWaitMs) {
      const elapsedMs = Date.now() - startTime;
      console.log(`[F2F Step] ${elapsedMs}ms: Attempting journey...`);

      try {
        await orchestratorPage.navigate();
        await orchestratorPage.setUserId(userId);
        await orchestratorPage.startFullJourney();

        console.log('[F2F Step] Checking for Kenneth reuse screen...');
        await identityPage.expectReuseScreenForKenneth();

        // Success!
        console.log(`[F2F Step] ✅ Kenneth screen found at ${Date.now() - startTime}ms!`);
        await identityPage.continueToService();
        await orchestratorPage.expectRawUserInfoVisible();
        await orchestratorPage.expandRawUserInfo();
        await orchestratorPage.expectF2FCriTypes();
        console.log('[F2F Step] ✅ All checks passed!');
        return;
      } catch (error) {
        lastError = error as Error;
        const elapsedMs = Date.now() - startTime;
        console.log(`[F2F Step] ❌ Failed at ${elapsedMs}ms: ${lastError.message}`);

        if (elapsedMs >= maxWaitMs) {
          console.log('[F2F Step] ❌ Max timeout exceeded, stopping retries');
          throw lastError;
        }

        console.log(`[F2F Step] Retrying in ${retryIntervalMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }

    throw new Error(`Async F2F verification failed after ${Date.now() - startTime}ms. Last error: ${lastError?.message}`);
  }
);
