import { expect } from "@playwright/test";
import { BasePage } from "./base-page";
import { EvidenceScores } from "../types/test-data";

export class StubPage extends BasePage {
  async selectTestData(testData: string): Promise<void> {
    await this.selectOption("#test_data", testData);
    await expect(this.page.locator("#test_data")).toHaveValue(testData);
  }

  async setEvidenceScores(scores: EvidenceScores): Promise<void> {
    if (scores.strength) {
      await this.page
        .getByRole("spinbutton", { name: "Strength" })
        .fill(scores.strength);
    }
    if (scores.validity) {
      await this.page
        .getByRole("spinbutton", { name: "Validity" })
        .fill(scores.validity);
    }
    if (scores.activityHistory) {
      await this.page
        .getByRole("spinbutton", { name: "Activity History" })
        .fill(scores.activityHistory);
    }
    if (scores.biometricVerification) {
      await this.page
        .getByRole("spinbutton", {
          name: "Biometric Verification Process Level",
        })
        .fill(scores.biometricVerification);
    }
    if (scores.fraud) {
      await this.page
        .getByRole("spinbutton", { name: "Fraud" })
        .fill(scores.fraud);
    }
  }

  async submitData(): Promise<void> {
    await this.clickButton("submit");
  }

  async overrideVCNotBefore(): Promise<void> {
    await this.page.locator("#vcNotBeforeFlg").check();
  }
}
