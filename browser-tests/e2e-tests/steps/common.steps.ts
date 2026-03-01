import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { expect } from "@playwright/test";

const { When, Then } = createBdd(fixtures);

/**
 * Common start of journey steps
 */
When(
  "the user starts a new journey in {string}",
  async ({ orchStubUtils }, env: string) => {
    await orchStubUtils.startJourney(env);
  },
);

// An alternative to the above new journey step where we need to wait for
// an async VC which might require a few retries.
When(
  "the user starts a new journey in {string} until they get a {string} page",
  async ({ pageUtils, orchStubUtils }, env: string, expectedPage: string) => {
    const startTime = Date.now();
    const maxWaitMs = 20000; // 20 second timeout
    const retryIntervalMs = 2000; // Retry every 2 seconds
    let lastError: Error | null = null;

    while (Date.now() - startTime < maxWaitMs) {
      const elapsedMs = Date.now() - startTime;
      console.log(`${elapsedMs}ms: Attempting new journey with retry...`);

      try {
        await orchStubUtils.startJourney(env);
        await pageUtils.expectPage(expectedPage);
        return;
      } catch (error) {
        lastError = error as Error;
        const elapsedMs = Date.now() - startTime;
        console.log(`❌ Failed at ${elapsedMs}ms: ${lastError.message}`);

        if (elapsedMs >= maxWaitMs) {
          console.log("❌ Max timeout exceeded, stopping retries");
          throw lastError;
        }

        console.log(`Retrying in ${retryIntervalMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }

    throw new Error(
      `Failed after ${Date.now() - startTime}ms. Last error: ${lastError?.message}`,
    );
  },
);

When(
  /^the user selects they are (not )?from the UK$/,
  async ({ pageUtils }, notFromUk?: "not ") => {
    await pageUtils.selectRadioAndContinue(notFromUk ? "international" : "uk");
  },
);

When(
  /^the user confirms they (don't )?have suitable photo ID$/,
  async ({ pageUtils }, noPhotoId?: "don't ") => {
    // On page-ipv-identity-document-start page
    await pageUtils.selectRadioAndContinue(noPhotoId ? "end" : "appTriage");
  },
);

/**
 * Generic page assertions and interactions
 */
When(
  "the user selects {string} radio option and continues",
  async ({ pageUtils }, radioOption: string) => {
    await pageUtils.selectRadioAndContinue(radioOption);
  },
);

Then(
  "the user should see the {string} page",
  async ({ pageUtils }, expectedPage) => {
    await pageUtils.expectPage(expectedPage);
  },
);

When("the user chooses to continue", async ({ pageUtils }) => {
  await pageUtils.getContinueButton().click();
});

Then(
  "the user should see text {string} by {int} seconds",
  async ({ page }, text: string, timeout: number) => {
    const locator = page.locator(`//*[contains(text(),"${text}")]`).first();
    await expect(locator).toBeAttached({ timeout: timeout * 1000 });
  },
);

/**
 * Common CRI interactions
 */
When(
  "the user submits {string} details to the {string} CRI stub",
  async ({ criStubUtils }, scenario: string, cri: string) => {
    await criStubUtils.submitDetailsToCriStub(scenario, cri);
  },
);

/**
 * Common end-of-journey orch stub steps
 */
Then(
  "the user should have a {string} identity",
  async ({ orchStubUtils }, expectedVot: string) => {
    await orchStubUtils.expectVot(expectedVot);
  },
);
