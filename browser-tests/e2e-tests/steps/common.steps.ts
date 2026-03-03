import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { expect } from "@playwright/test";

const { When, Then } = createBdd(fixtures);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// reusable retryUntil function which can be used in any step where we want to retry an
// action until it succeeds or a timeout is reached. This is particularly useful for the
// case where we're waiting for an async VC to be ready which might require multiple attempts.
const retryUntil = async (
  action: () => Promise<void>,
  maxWaitMs = 20000,
  retryIntervalMs = 2000,
): Promise<void> => {
  const startTime = Date.now();
  let lastError: Error;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `❌ Failed at ${Date.now() - startTime}ms: ${lastError.message}`,
      );
      await sleep(retryIntervalMs);
    }
  }

  throw new Error(
    `Timed out after ${maxWaitMs}ms. Last error: ${lastError!.message}`,
  );
};

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
    await retryUntil(async () => {
      await orchStubUtils.startJourney(env);
      await pageUtils.expectPage(expectedPage);
    });
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
