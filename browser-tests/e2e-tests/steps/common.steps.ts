import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { expect } from "@playwright/test";
import { PageActions, pageScenarioActions } from "./page-scenario-actions";
import { PageUtils } from "../fixtures/pages-fixture";

const { When, Then } = createBdd(fixtures);

export const performPageActionForScenario = async (
  { pageUtils }: { pageUtils: PageUtils },
  scenario: keyof typeof pageScenarioActions,
): Promise<void> => {
  if (!(scenario in pageScenarioActions)) {
    throw new Error(
      `Unknown scenario: "${scenario}".\n` +
        `Add it to pageScenarioActions in data/page-scenario-actions.ts — ` +
        `do not create a new step definition.`,
    );
  }
  const pageAction = pageScenarioActions[scenario] as PageActions;

  await pageUtils.expectPage(pageAction.page);

  if (pageAction.action) {
    await pageAction.action({ pageUtils });
  } else if (pageAction.radioValue) {
    await pageUtils.selectRadioAndContinue(pageAction.radioValue);
  } else {
    await pageUtils.getContinueButton().click();
  }
};

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
When("the user starts a new journey", async ({ orchStubUtils }) => {
  await orchStubUtils.startJourney();
});

// An alternative to the above new journey step where we need to wait for
// an async VC which might require a few retries.
When(
  "the user starts a new journey until they get a {string} page",
  async ({ pageUtils, orchStubUtils }, expectedPage: string) => {
    await retryUntil(async () => {
      await orchStubUtils.startJourney();
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
// This step should be used for all simple IPV page interactions (e.g. where the
// user has to select a radio option and continues). This ensures that the Gherkin
// scenarios align with BDD best practices of steps describing the intended
// behaviour of the system rather than the implementation e.g. instead of
// "the user selects 'uk' and continues", we should write "the user is from the UK"
When("the user {string}", performPageActionForScenario);

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
// Put this into its own file
When(
  /^the user submits '([\w-]+)' '([\w-]+)' details to the CRI( with a '([\w-]+)' CI)?$/,
  async ({ criStubUtils }, scenario: string, cri: string, ci?: string) => {
    await criStubUtils.submitDetailsToCriStub(scenario, cri, ci);
  },
);

When(
  /^the user submits '([\w-]+)' '([\w-]+)' details to the CRI to mitigate the '([\w-]+)' CI$/,
  async (
    { criStubUtils },
    scenario: string,
    cri: string,
    mitigatedCi: string,
  ) => {
    await criStubUtils.submitDetailsToCriStub(
      scenario,
      cri,
      undefined,
      mitigatedCi,
    );
  },
);

/**
 * Common end-of-journey orch stub steps
 */
// put this into its own file
Then(
  "the user should have a {string} identity",
  async ({ orchStubUtils }, expectedVot: string) => {
    await orchStubUtils.expectVot(expectedVot);
  },
);
