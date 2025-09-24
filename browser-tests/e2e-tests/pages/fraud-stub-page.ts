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
}
