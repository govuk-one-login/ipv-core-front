import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures/bdd-fixtures";
import { BddContext } from "./bdd-context";

const { Given, When, Then } = createBdd(test);

Given(
  "the user completes an initial P2 identity journey with expired Alice Parker details",
  async ({
    identityPage,
    pageUtils,
    dcmawAsyncService,
    criStubUtils,
  }) => {
    // Journey already started in background step — continue from identity page
    await identityPage.selectUKLocation();
    await identityPage.confirmEligibility();

    // App triage via DAD iphone
    await pageUtils.selectRadioAndContinue("computer-or-tablet");
    await pageUtils.selectRadioAndContinue("iphone");

    // Enqueue VC for Alice Parker DVLA
    const userId = BddContext.get("userId");
    const oauthState = await dcmawAsyncService.enqueueVcWithScenario(
      userId,
      "alice-parker-dvla",
    );
    BddContext.set("oauthState", oauthState);

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
    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-valid",
      "address",
    );

    // submit fraud details
    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-expired-fraud",
      "fraud",
    );
  },
);

When(
  "the user chooses to update their given name",
  async ({ identityPage }) => {
    await identityPage.selectUpdateDetails();
    await identityPage.selectUpdateNameMethod();
  },
);

Then(
  "Alison Parker's credentials should be passed to the orch stub",
  async ({ orchestratorPage, page }) => {
    await orchestratorPage.expectRawUserInfoVisible();
    await orchestratorPage.expandRawUserInfo();

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
