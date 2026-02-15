import { expect } from '@playwright/test';
import { BasePage } from './base-page';
import { EvidenceScores } from '../types/test-data';

export class StubPage extends BasePage {
  async selectTestData(testData: string): Promise<void> {
    await this.selectOption('#test_data', testData);
    await expect(this.page.locator('#test_data')).toHaveValue(testData);
  }

  async setEvidenceScores(scores: EvidenceScores): Promise<void> {
    if (scores.strengthHours) {
      await this.page.getByRole('spinbutton', { name: 'Strength Hours' }).fill(scores.strengthHours);
    }
    if (scores.validityMinutes) {
      await this.page.getByRole('spinbutton', { name: 'Validity Minutes' }).fill(scores.validityMinutes);
    }
    if (scores.activityHistorySeconds) {
      await this.page.getByRole('spinbutton', { name: 'Activity History Seconds' }).fill(scores.activityHistorySeconds);
    }
    if (scores.biometricVerification) {
      await this.page.getByRole('spinbutton', { name: 'Biometric Verification' }).fill(scores.biometricVerification);
    }
    if (scores.fraud) {
      await this.page.getByRole('spinbutton', { name: 'Fraud' }).fill(scores.fraud);
    }
    if (scores.activity) {
      await this.page.getByRole('spinbutton', { name: 'Activity' }).fill(scores.activity);
    }
  }

  async submitData(): Promise<void> {
    await this.clickButton('Submit data and generate auth');
  }

  async overrideVCNotBefore(): Promise<void> {
    // Selenium: @FindBy(id = "vcNotBeforeFlg") → overideVCNotBefore.click()
    await this.page.locator('#vcNotBeforeFlg').check();
  }
}