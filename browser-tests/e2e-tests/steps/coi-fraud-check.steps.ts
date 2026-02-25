import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures/bdd-fixtures";
import { BddContext } from "./bdd-context";

const { Given, When, Then } = createBdd(test);

Given(
  "I navigate to Orchestrator Stub and start journey",
  async ({ orchestratorPage }) => {
    await orchestratorPage.navigate();
    const userId = await orchestratorPage.getUserId();
    await orchestratorPage.setJourneyId("testId");
    expect(userId).toBeTruthy();
    BddContext.set("userId", userId);
    console.log("User ID: " + userId);
    await orchestratorPage.startFullJourney();
  },
);

Given(
  "I configure TICF Management API",
  async ({ orchestratorPage, apiService }) => {
    // Use the userId stored from the initial navigation — page is no longer on orchestrator stub
    const userId = BddContext.get("userId");
    expect(userId).toBeTruthy();
    await apiService.configureTicfManagementApi(userId);
  },
);

Given(
  "I complete initial P2 identity journey",
  async ({
    orchestratorPage,
    identityPage,
    drivingLicencePage,
    addressPage,
    fraudPage,
    pageUtils,
    dcmawAsyncService,
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

    // Process driving licence evidence
    await drivingLicencePage.processAliceParkerValid();
    await identityPage.continueFromDcmaw();

    // Process address evidence
    await addressPage.processAliceParkerValidAddress();

    // Process fraud evidence
    await fraudPage.processAliceParkerValid();

    // Complete initial journey at IPV success page
    await identityPage.expectIPVSuccess();
    await identityPage.continueToService();
    await orchestratorPage.expectRawUserInfoVisible();
  },
);

When(
  "I start reuse journey for name change",
  async ({
    orchestratorPage,
    identityPage,
    drivingLicencePage,
    fraudPage,
    pageUtils,
    dcmawAsyncService,
  }) => {
    const userId = BddContext.get("userId");

    await orchestratorPage.navigate();
    await orchestratorPage.setUserId(userId);
    await orchestratorPage.startFullJourney();

    // Don't navigate directly — startFullJourney() routes returning P2 users to confirm-your-details
    await identityPage.selectUpdateDetails();
    await identityPage.selectUpdateNameMethod();

    // App triage via DAD iphone
    await pageUtils.selectRadioAndContinue("computer-or-tablet");
    await pageUtils.selectRadioAndContinue("iphone");

    // Enqueue VC for Alice Parker DVLA
    const oauthState = await dcmawAsyncService.enqueueVcWithScenario(
      userId,
      "alice-parker-changed-first-name-dvla",
    );
    BddContext.set("oauthState", oauthState);

    // Wait until continue button is enabled on download page
    await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);

    // Process driving licence with name change
    await drivingLicencePage.processAliceParkerNameChange();
    // Selenium: enterStubDLDetailsDLAuthCheck calls clickSubmitAuth() then clickContinue()
    // The DL submit lands on a DCMAW success page — need to click continue
    await identityPage.continueFromDcmaw();

    // Process fraud evidence with name change
    await fraudPage.processAliceParkerNameChange();

    // Complete name change journey at IPV success page
    await identityPage.expectIPVSuccess();
    await identityPage.continueToService();
    await orchestratorPage.expectRawUserInfoVisible();
    await orchestratorPage.expandRawUserInfo();
    await orchestratorPage.expectCriTypes();
  },
);

Then(
  "I should see the verify final reuse screen after name change",
  async ({ orchestratorPage, identityPage }) => {
    const userId = BddContext.get("userId");

    await orchestratorPage.navigate();
    await orchestratorPage.setUserId(userId);
    await orchestratorPage.startFullJourney();
    await identityPage.expectReuseScreen();
  },
);
