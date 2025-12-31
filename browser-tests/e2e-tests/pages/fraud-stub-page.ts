import { StubPage } from './stub-page';

export class FraudStubPage extends StubPage {
  async processAliceParkerValid(): Promise<void> {
    await this.selectTestData('Alice Parker (Valid) Fraud');
    await this.setEvidenceScores({
      fraud: '2',
      activity: '1'
    });
    await this.overrideVCNotBefore();
    await this.submitData();
  }

  async processAliceParkerNameChange(): Promise<void> {
    await this.selectTestData('Alice Parker (Changed First Name) Fraud');
    await this.setEvidenceScores({
      fraud: '2',
      activity: '1'
    });
    await this.submitData();
  }

  async processKennethDecerqueiraFraud(): Promise<void> {
    await this.selectTestData('Kenneth Decerqueira (Valid Experian) Fraud');
    await this.overrideEvidenceBlock();
    await this.setCustomEvidence('Passed fraud check (M1A)');
    await this.submitData();
  }

  async overrideEvidenceBlock(): Promise<void> {
    await this.selectCheckbox('Override evidence block');
  }

  async setCustomEvidence(evidenceValue: string): Promise<void> {
    await this.selectOption('#custom_evidence', evidenceValue);
  }
}
