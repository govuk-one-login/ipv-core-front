import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import {
  enqueueVc,
  enqueueVcWithScenario,
} from "../clients/dcmaw-async-client";
import config from "../config";

const { When } = createBdd(fixtures);

/**
 * Generic CRI steps
 */
When(
  /^the user submits '([\w-]+)' '([\w-]+)' details to the CRI( with a '([\w-]+)' CI)?$/,
  async ({ criStubUtils }, scenario: string, cri: string, ci?: string) => {
    await criStubUtils.submitDetailsToCriStub(scenario, cri, ci);
  },
);

When(
  /^the user submits '([\w-]+)' '([\w-]+)' details to the CRI to mitigate the '([\w-]+)' CI$/,
  async (
    { criStubUtils },
    scenario: string,
    cri: string,
    mitigatedCi: string,
  ) => {
    await criStubUtils.submitDetailsToCriStub(
      scenario,
      cri,
      undefined,
      mitigatedCi,
    );
  },
);

/**
 * DCMAW Async VC steps
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

// MAM callback from mobile app
When(
  "the user returns from the app to core-front",
  async ({ page, scenarioContext }) => {
    const oauthState = scenarioContext.oauthState;

    const callbackUrl = `${config.coreFrontUrl}/app/callback?state=${oauthState}`;
    await page.goto(callbackUrl);
  },
);
