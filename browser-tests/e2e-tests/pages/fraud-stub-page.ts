import { StubPage } from './stub-page';

export class FraudStubPage extends StubPage {
  async processAliceParkerValid(): Promise<void> {
    await this.selectTestData('Alice Parker (Valid) Fraud');
    // Selenium: enterFraudVCExpiryForUser — uses #fraud and #activity directly
    await this.page.locator('#fraud').fill('2');
    await this.page.locator('#activity').fill('1');
    await this.overrideVCNotBefore();
    await this.submitData();
  }

  async processAliceParkerNameChange(): Promise<void> {
    await this.selectTestData('Alice Parker (Changed First Name) Fraud');
    // Selenium: enterFraudDetails(ciCodes, userName) — uses #fraud and #activity directly
    await this.page.locator('#fraud').fill('2');
    await this.page.locator('#activity').fill('1');
    await this.submitData();
  }

  async processKennethDecerqueiraFraud(): Promise<void> {
    await this.selectTestData('Kenneth Decerqueira (Valid Experian) Fraud');
    // Selenium: fraudScore.sendKeys("2") → #fraud
    await this.page.locator('#fraud').fill('2');
    // Selenium: activityHistoryScore.sendKeys("1") → #activity
    await this.page.locator('#activity').fill('1');
    await this.submitData();
  }

  async overrideEvidenceBlock(): Promise<void> {
    await this.selectCheckbox('Override evidence block');
  }

  async setCustomEvidence(evidenceValue: string): Promise<void> {
    await this.selectOption('#custom_evidence', evidenceValue);
  }
}
