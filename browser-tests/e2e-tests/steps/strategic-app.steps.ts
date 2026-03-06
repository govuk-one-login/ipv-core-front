import { createBdd } from "playwright-bdd";
import { expect, Page } from "@playwright/test";
import fixtures, { ScenarioContext } from "../fixtures";
import config from "../config";
import {
  enqueueVc,
  enqueueVcWithScenario,
} from "../clients/dcmaw-async-client";
import { PageUtils } from "../fixtures/pages-fixture";

const { When, Then } = createBdd(fixtures);

/**
 * App triage steps
 */
When(
  "the user drops out of the app due to an incompatible device",
  async ({ pageUtils }) => {
    // On pyi-triage-select-device
    await pageUtils.selectRadioAndContinue("computer-or-tablet");
    // On pyi-triage-select-smartphone context=dad
    await pageUtils.selectRadioAndContinue("neither");
    // On pyi-triage-buffer
    await pageUtils.selectRadioAndContinue("anotherWay");
  },
);

When(
  /^the user goes through '(MAM|DAD)' '(iphone|android)' triage$/,
  async (
    { pageUtils },
    deviceType: "MAM" | "DAD",
    phoneType: "iphone" | "android",
  ) => {
    // On pyi-triage-select-device
    if (deviceType === "DAD")
      await pageUtils.selectRadioAndContinue("computer-or-tablet");
    else {
      await pageUtils.selectRadioAndContinue("smartphone");
    }
    // On pyi-triage-select-smartphone
    await pageUtils.selectRadioAndContinue(phoneType);
  },
);

/**
 * Continue from download page steps
 */
Then(
  "the continue button should be enabled within {int} seconds",
  async ({ pageUtils }, timeout: number) => {
    const continueButton = pageUtils.getContinueButton();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
  },
);

/**
 * DCMAW Async VC production
 */

When(
  "the user submits {string} {string} {string} details to the app",
  async (
    { scenarioContext },
    testUser: string,
    documentType: string,
    evidenceType: string,
  ) => {
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("Missing userId");
    }
    scenarioContext.oauthState = await enqueueVc(
      userId,
      testUser,
      documentType,
      evidenceType,
    );
  },
);

export const enqueueDcmawAsyncVcWithScenario = async (
  {
    pageUtils,
    page,
    scenarioContext,
  }: { pageUtils: PageUtils; page: Page; scenarioContext: ScenarioContext },
  successfulOrFailed: "successful" | "failed",
  scenario: string,
  appTriageJourneyType: "DAD" | "MAM",
): Promise<void> => {
  const userId = scenarioContext.userId;
  if (!userId) {
    throw new Error("Missing userId");
  }

  const oauthState = await enqueueVcWithScenario(
    userId,
    scenario,
    successfulOrFailed,
  );
  scenarioContext.oauthState = oauthState;

  if (appTriageJourneyType === "MAM") {
    // Manually perform app callback
    await page.goto(`${config.coreFrontUrl}/app/callback?state=${oauthState}`);
  }

  await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);
};

When(
  "the user submits {string} {string} details and continues from the {string} journey",
  enqueueDcmawAsyncVcWithScenario,
);

/**
 * MAM callback from mobile app
 */

When(
  "the user returns from the app to core-front",
  async ({ page, scenarioContext }) => {
    const oauthState = scenarioContext.oauthState;

    const callbackUrl = `${config.coreFrontUrl}/app/callback?state=${oauthState}`;
    await page.goto(callbackUrl);
  },
);
