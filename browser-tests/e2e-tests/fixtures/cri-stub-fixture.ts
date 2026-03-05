import { Page } from "@playwright/test";
import { PageUtils } from "./pages-fixture";
import {
  criStubData,
  CriStubDataConfig,
  EvidenceScores,
} from "../data/cri-stub-data";

export interface CriStubUtils {
  submitDetailsToCriStub: (scenario: string, cri: string) => Promise<void>;
}

export const criStubUtils = (page: Page, utils: PageUtils): CriStubUtils => {
  const TEST_DATA_INPUT = "#test_data";
  const SEND_VC_TO_QUEUE_CHECKBOX = "#f2f_send_vc_queue";
  const OVERRIDE_VC_CHECKBOX = "#vcNotBeforeFlg";
  const STRENGTH_SCORE_INPUT = "#strength";
  const VALIDITY_SCORE_INTPUT = "#validity";
  const ACTIVITY_SCORE_INPUT = "#activity";
  const ACTIVITY_HISTORY_SCORE_INPUT = "#activityHistory";
  const VERIFICATION_SCORE_INPUT = "#verification";
  const FRAUD_SCORE_INPUT = "#fraud";

  const getCriStubTestDataConfig = (
    scenario: string,
    cri: string,
  ): CriStubDataConfig => {
    const testDataConfig = criStubData[scenario]?.[cri];

    if (!testDataConfig) {
      throw new Error(
        `No CRI stub data for persona '${scenario}' + CRI '${cri}'`,
      );
    }

    return testDataConfig;
  };

  const setTestData = async (testDataIdentifier: string): Promise<void> => {
    await page.locator(TEST_DATA_INPUT).selectOption(testDataIdentifier);
  };

  const setEvidenceScores = async (scores: EvidenceScores): Promise<void> => {
    if (scores.strength) {
      await page.locator(STRENGTH_SCORE_INPUT).fill(scores.strength.toString());
    }
    if (scores.validity) {
      await page
        .locator(VALIDITY_SCORE_INTPUT)
        .fill(scores.validity.toString());
    }
    if (scores.activityHistory) {
      await page
        .locator(ACTIVITY_HISTORY_SCORE_INPUT)
        .or(page.locator(ACTIVITY_SCORE_INPUT))
        .first()
        .fill(scores.activityHistory.toString());
    }
    if (scores.verification) {
      await page
        .locator(VERIFICATION_SCORE_INPUT)
        .fill(scores.verification.toString());
    }
    if (scores.fraud) {
      await page.locator(FRAUD_SCORE_INPUT).fill(scores.fraud.toString());
    }
  };

  const submitDetailsToCriStub = async (
    scenario: string,
    cri: string,
  ): Promise<void> => {
    const testDataConfig = getCriStubTestDataConfig(scenario, cri);

    if (testDataConfig.cannedStubData) {
      await setTestData(testDataConfig.cannedStubData);
    }

    if (testDataConfig.sendVcToAsyncQueue) {
      await page.locator(SEND_VC_TO_QUEUE_CHECKBOX).check();
    }

    if (testDataConfig.evidenceScores) {
      await setEvidenceScores(testDataConfig.evidenceScores);
    }

    if (testDataConfig.overrideVcNbf) {
      await page.locator(OVERRIDE_VC_CHECKBOX).check();
    }

    await utils.getContinueButton().click();
  };

  return {
    submitDetailsToCriStub,
  };
};
