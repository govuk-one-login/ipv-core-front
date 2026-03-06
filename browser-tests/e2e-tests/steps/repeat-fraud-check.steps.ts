import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";
import { performPageActionForScenario } from "./common.steps";
import { enqueueDcmawAsyncVcWithScenario } from "./strategic-app.steps";

const { Given, When, Then } = createBdd(fixtures);

Given(
  "the user completes an initial P2 identity journey with expired Alice Parker details",
  async ({ pageUtils, criStubUtils, scenarioContext, page }) => {
    // On live-in-uk page
    await performPageActionForScenario({ pageUtils }, "is from the UK");
    // On page-ipv-identity-document-start
    await performPageActionForScenario(
      { pageUtils },
      "has valid photo ID for the app",
    );

    // App triage via DAD iphone
    await performPageActionForScenario(
      { pageUtils },
      "is on a computer or tablet",
    );
    await performPageActionForScenario({ pageUtils }, "has an iphone");

    await enqueueDcmawAsyncVcWithScenario(
      { pageUtils, page, scenarioContext },
      "successful",
      "alice-parker-valid",
      "DAD",
    );

    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-valid",
      "driving-licence",
    );
    // On page-dcmaw-success
    await pageUtils.getContinueButton().click();

    await criStubUtils.submitDetailsToCriStub("alice-parker-valid", "address");

    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-expired-fraud",
      "fraud",
    );
  },
);

When(
  "the user chooses to update their given name via the app",
  async ({ pageUtils }) => {
    await pageUtils.selectRadio("no");
    await pageUtils.selectCheckbox("givenNames");
    await pageUtils.getContinueButton().click();
    await pageUtils.selectRadioAndContinue("update-name");
  },
);

// This is specific to the journey in scenario: Pass successfully for a given
// name change and show reuse screen
Then(
  "Alison Parker's credentials should be passed to the orch stub",
  async ({ page }) => {
    await page
      .locator("summary")
      .filter({ hasText: "Raw User Info Object" })
      .click();

    const expectedCriTypes = [
      "Cri Type: https://address-cri",
      "Cri Type: https://dcmaw-async.",
      "Cri Type: https://driving-",
      "Cri Type: https://fraud-cri.",
      "Cri Type: https://cimit.stubs",
      "Cri Type: https://ticf.stubs.",
    ];
    for (const criType of expectedCriTypes) {
      await expect(page.getByText(criType)).toBeVisible();
    }
  },
);

Then(
  "Alison Parker's information is displayed on the reuse screen",
  async ({ page }) => {
    await expect(page.getByText("ALISON JANE PARKER")).toBeVisible();
    await expect(page.getByText("80T")).toBeVisible();
    await expect(page.getByText("YEOMAN WAY")).toBeVisible();
    await expect(page.getByText("TROWBRIDGE")).toBeVisible();
    await expect(page.getByText("BA14")).toBeVisible();
    await expect(page.getByText("January 1970")).toBeVisible();
  },
);
