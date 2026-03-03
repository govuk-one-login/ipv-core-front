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
    if (scores.verification) {
      await page.locator("#verification").fill(scores.verification);
    }
    if (scores.fraud) {
      await page.locator("#fraud").fill(scores.fraud);
    }
  };

  const submitDetailsToCriStub = async (
    scenario: string,
    cri: string,
  ): Promise<void> => {
    const testDataConfig = getCriStubTestDataConfig(scenario, cri);

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

    await utils.getContinueButton().click();
  };

  return {
    submitDetailsToCriStub,
  };
};
