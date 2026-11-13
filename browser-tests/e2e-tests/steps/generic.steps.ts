import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { expect } from "@playwright/test";

const { When, Then } = createBdd(fixtures);

/**
 * Generic page assertions and interactions
 */
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

Then(
  "the continue button should be enabled within {int} seconds",
  async ({ pageUtils }, timeout: number) => {
    const continueButton = pageUtils.getContinueButton();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
  },
);
