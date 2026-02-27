import { Page } from "@playwright/test";
import { getCriStubTestDataConfig } from "../utils/cri-stub-data";
import { EvidenceScores } from "../types/test-data";
import { pageUtils } from "./pages-fixture";

export const criStubUtils = (
  page: Page,
  utils: ReturnType<typeof pageUtils>,
) => {
  const TEST_DATA_INPUT = "#test_data";
  const SEND_VC_TO_QUEUE_CHECKBOX = "#f2f_send_vc_queue";
  const OVERRIDE_VC_CHECKBOX = "#vcNotBeforeFlg";

  const setTestData = async (testDataIdentifier: string) => {
    await page.locator(TEST_DATA_INPUT).selectOption(testDataIdentifier);
  };

  const setEvidenceScores = async (scores: EvidenceScores) => {
    if (scores.strength) {
      await page.locator("#strength").fill(scores.strength);
    }
    if (scores.validity) {
      await page.locator("#validity").fill(scores.validity);
    }
    if (scores.activityHistory) {
      await page
        .locator("#activityHistory")
        .or(page.locator("#activity"))
        .first()
        .fill(scores.activityHistory);
    }
    if (scores.biometricVerification) {
      await page.locator("#verification").fill(scores.biometricVerification);
    }
    if (scores.fraud) {
      await page.locator("#fraud").fill(scores.fraud);
    }
  };

  const submitDetailsToCriStub = async (scenario: string, cri: string) => {
    const testDataConfig = getCriStubTestDataConfig(scenario, cri);

    console.log(`Submitting ${scenario} details to the ${cri} stub`);
    await setTestData(testDataConfig.stubData);

    if (testDataConfig.sendVcToAsyncQueue) {
      await page.locator(SEND_VC_TO_QUEUE_CHECKBOX).check();
    }

    if (testDataConfig.evidenceScores) {
      await setEvidenceScores(testDataConfig.evidenceScores);
    }

    if (testDataConfig.overrideVcNbf) {
      await page.locator(OVERRIDE_VC_CHECKBOX).check();
    }

    await utils.selectContinueButton();
  };

  return {
    submitDetailsToCriStub,
  };
};
