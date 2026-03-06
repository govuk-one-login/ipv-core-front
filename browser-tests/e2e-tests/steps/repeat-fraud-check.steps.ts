import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";
import { enqueueVcWithScenario } from "../clients/dcmaw-async-client";
import { selectResidenceLocation } from "./ipv-page-steps/live-in-uk.steps";
import { selectPhotoIdAvailability } from "./ipv-page-steps/page-ipv-identity-document-start.steps";
import { selectDevice } from "./ipv-page-steps/pyi-triage-select-device.steps";
import { selectSmartphone } from "./ipv-page-steps/pyi-triage-select-smartphone.steps";

const { Given, Then } = createBdd(fixtures);

Given(
  "the user completes an initial P2 identity journey with expired Alice Parker details",
  async ({ pageUtils, criStubUtils, scenarioContext }) => {
    await selectResidenceLocation(pageUtils, true);
    await selectPhotoIdAvailability(pageUtils, true);
    await selectDevice(pageUtils, "computer-or-tablet");
    await selectSmartphone(pageUtils, "iphone");

    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("Missing userId");
    }
    scenarioContext.oauthState = await enqueueVcWithScenario(
      userId,
      "alice-parker-valid",
      "successful",
    );

    await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);

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
