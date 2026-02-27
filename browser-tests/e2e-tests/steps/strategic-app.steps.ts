import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";
import { CONFIG } from "../config/test-config";
import {
  enqueueVc,
  enqueueVcWithScenario,
} from "../clients/dcmaw-async-client";

const { When, Then } = createBdd(fixtures);

When(
  /^the user confirms they (don't )?have suitable photo ID$/,
  async ({ pageUtils }, noPhotoId?: "don't ") => {
    // On page-ipv-identity-document-start page
    await pageUtils.selectRadioAndContinue(noPhotoId ? "end" : "appTriage");
  },
);

Then(
  "the user should see text {string} by {int} seconds",
  async ({ page }, text: string, timeout: number) => {
    const locator = page.locator(`//*[contains(text(),"${text}")]`).first();
    await expect(locator).toBeAttached({ timeout: timeout * 1000 });
  },
);

// --- Radio selection and continue ---
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
  "the user goes through {string} {string} triage",
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

// --- Continue button steps ---

Then(
  "the continue button should be enabled within {int} seconds",
  async ({ page }, timeout: number) => {
    const continueButton = page
      .locator(
        '#continue, #submitButton, button[type="submit"], button[data-id="next"], button:has-text("Continue")',
      )
      .first();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
  },
);

// --- DCMAW CRI async VC production ---

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
    console.log(
      `[StrategicApp] Enqueuing DCMAW VC for user ${userId}: ${testUser} ${documentType} ${evidenceType}`,
    );
    const oauthState = await enqueueVc(
      userId,
      testUser,
      documentType,
      evidenceType,
    );
    scenarioContext.oauthState = oauthState;
    console.log(`[StrategicApp] ✓ DCMAW VC enqueued.`);
  },
);

When(
  "the user submits {string} details and continues from the {string} journey",
  async (
    { pageUtils, page, scenarioContext },
    scenario: string,
    appTriageJourneyType: "DAD" | "MAM",
  ) => {
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("Missing userId");
    }

    // Enqueue VC for Alice Parker DVLA
    const oauthState = await enqueueVcWithScenario(userId, scenario);
    scenarioContext.oauthState = oauthState;

    if (appTriageJourneyType === "MAM") {
      // Manually perform app callback
      await page.goto(`${CONFIG.URLS.CORE}/app/callback?state=${oauthState}`);
    }

    // Wait until continue button is enabled on download page
    await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);
  },
);

// --- MAM callback from mobile app ---

When(
  "user returns from the app to core-front",
  async ({ page, scenarioContext }) => {
    const currentUrl = new URL(page.url());
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    const oauthState = scenarioContext.oauthState;

    const callbackUrl = `${baseUrl}/app/callback?state=${oauthState}`;
    console.log(`[StrategicApp] Navigating to app callback: ${callbackUrl}`);
    await page.goto(callbackUrl);
    console.log("[StrategicApp] ✓ Returned from app to core-front");
  },
);

// --- Identity verification assertion ---

Then(
  "the user should have a {string} identity",
  async ({ orchStubUtils }, expectedVot: string) => {
    await orchStubUtils.expectVot(expectedVot);
  },
);
