import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";

const { Then } = createBdd(fixtures);

// This is specific to the journey in scenario: F2F Passport claim is returned
// in the user identity response.
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
