import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";
import { enqueueVcWithScenario } from "../clients/dcmaw-async-client";

const { Given, When, Then } = createBdd(fixtures);

Given(
  "the user completes an initial P2 identity journey with expired Alice Parker details",
  async ({ pageUtils, criStubUtils, scenarioContext }) => {
    // On live-in-uk page
    await pageUtils.selectRadioAndContinue("uk");
    // On page-ipv-identity-document-start
    await pageUtils.selectRadioAndContinue("appTriage");

    // App triage via DAD iphone
    await pageUtils.selectRadioAndContinue("computer-or-tablet");
    await pageUtils.selectRadioAndContinue("iphone");

    // Enqueue VC for Alice Parker DVLA
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("Missing userId");
    }
    const oauthState = await enqueueVcWithScenario(userId, "alice-parker-dvla");
    scenarioContext.oauthState = oauthState;

    // Wait until continue button is enabled on download page
    await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);

    // submit DL details
    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-valid",
      "driving-licence",
    );
    // On page-dcmaw-success
    await pageUtils.selectContinueButton();

    // submit address details
    await criStubUtils.submitDetailsToCriStub("alice-parker-valid", "address");

    // submit fraud details
    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-expired-fraud",
      "fraud",
    );
  },
);

When("the user chooses to update their given name via the app", async ({ pageUtils }) => {
  await pageUtils.selectRadio("no");
  await pageUtils.selectCheckbox("givenNames");
  await pageUtils.selectContinueButton();
  await pageUtils.selectRadioAndContinue("update-name")
});

Then(
  "Alison Parker's credentials should be passed to the orch stub",
  async ({ page }) => {
    page.locator("summary").filter({ hasText: "Raw User Info Object" }).click();

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
