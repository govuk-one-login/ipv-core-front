import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";

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

/**
 * Common end of journey steps
 */
Then(
  "the user should have a {string} identity",
  async ({ orchStubUtils }, expectedVot: string) => {
    await orchStubUtils.expectVot(expectedVot);
  },
);
