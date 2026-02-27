import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";

const { When, Then } = createBdd(fixtures);

When(
  "the user starts a new journey in {string} until they get a {string} page",
  async ({ pageUtils, orchStubUtils }, env: string, expectedPage: string) => {
    const startTime = Date.now();
    const maxWaitMs = 20000; // 20 second timeout
    const retryIntervalMs = 2000; // Retry every 2 seconds
    let lastError: Error | null = null;

    console.log("[F2F Step] Starting retry loop for async F2F processing...");

    while (Date.now() - startTime < maxWaitMs) {
      const elapsedMs = Date.now() - startTime;
      console.log(`[F2F Step] ${elapsedMs}ms: Attempting journey...`);

      try {
        await orchStubUtils.startJourney(env);

        console.log(`[F2F Step] Checking for ${expectedPage} screen...`);
        await pageUtils.expectPage(expectedPage);

        // Success!
        console.log(
          `[F2F Step] ✅ ${expectedPage} screen found at ${Date.now() - startTime}ms!`,
        );
        return;
      } catch (error) {
        lastError = error as Error;
        const elapsedMs = Date.now() - startTime;
        console.log(
          `[F2F Step] ❌ Failed at ${elapsedMs}ms: ${lastError.message}`,
        );

        if (elapsedMs >= maxWaitMs) {
          console.log("[F2F Step] ❌ Max timeout exceeded, stopping retries");
          throw lastError;
        }

        console.log(`[F2F Step] Retrying in ${retryIntervalMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }

    throw new Error(
      `Async F2F verification failed after ${Date.now() - startTime}ms. Last error: ${lastError?.message}`,
    );
  },
);

Then(
  "Kenneth Decerqueira's credentials should be passed to the orch stub",
  async ({ page }) => {
    await page
      .locator("summary")
      .filter({ hasText: "Raw User Info Object" })
      .click();

    const expectedCriTypes = [
      "Cri Type: https://address-cri",
      "Cri Type: https://fraud-cri.",
      "Cri Type: https://f2f-cri.",
      "Cri Type: https://claimed-identity-cri.",
      "Cri Type: https://cimit.stubs",
      "Cri Type: https://ticf.stubs.",
    ];
    for (const criType of expectedCriTypes) {
      await expect(page.getByText(criType)).toBeVisible();
    }
  },
);
