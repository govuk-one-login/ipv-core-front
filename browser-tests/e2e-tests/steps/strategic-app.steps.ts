import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import config from "../config";
import {
  enqueueVc,
  enqueueVcWithScenario,
} from "../clients/dcmaw-async-client";

const { When } = createBdd(fixtures);

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

When(
  "the user submits {string} {string} details and continues from the {string} journey",
  async (
    { pageUtils, page, scenarioContext },
    successfulOrFailed: "successful" | "failed",
    scenario: string,
    appTriageJourneyType: "DAD" | "MAM",
  ) => {
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
      await page.goto(
        `${config.coreFrontUrl}/app/callback?state=${oauthState}`,
      );
    }

    await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);
  },
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
