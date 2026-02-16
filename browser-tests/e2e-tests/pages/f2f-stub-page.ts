import { StubPage } from './stub-page';
import { expect } from '@playwright/test';

export class F2FStubPage extends StubPage {
  async navigateToF2FStub(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async selectF2FTestData(testData: string): Promise<void> {
    await this.selectTestData(testData);
  }

  async processValidPassport(): Promise<void> {
    await this.selectTestData('Kenneth Decerqueira (Valid Passport)');
    await expect(this.page.locator('#test_data')).toHaveValue(
      'Kenneth Decerqueira (Valid Passport)'
    );
  }

  async overrideEvidenceBlock(): Promise<void> {
    await this.selectCheckbox('Override evidence block');
  }

  async setCustomEvidence(evidenceValue: string): Promise<void> {
    await this.selectOption('#custom_evidence', evidenceValue);
  }

  async setPassedF2FPassportCheck(): Promise<void> {
    await this.overrideEvidenceBlock();
    await this.setCustomEvidence('Passed f2f passport check');
  }

  async sendVCToAsyncQueue(): Promise<void> {
    await this.selectCheckbox('Send VC to async queue');
  }

  async submitF2FData(): Promise<void> {
    await this.submitData();
  }

  async processF2FPassportJourney(): Promise<void> {
    await this.processValidPassport();
    await this.sendVCToAsyncQueue();
    await this.setPassedF2FPassportCheck();
    await this.submitF2FData();
  }

  async processKennethDecerqueiraF2F(): Promise<void> {
    await this.selectTestData('Kenneth Decerqueira (Valid Passport)');
    await this.sendVCToAsyncQueue();
    await this.overrideEvidenceBlock();
    await this.setCustomEvidence('Passed f2f passport check');
    await this.submitF2FData();
  }
}
