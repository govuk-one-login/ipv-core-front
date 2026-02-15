import { StubPage } from './stub-page';

export class PassportStubPage extends StubPage {
  async selectTestDataAndSubmit(testData: string): Promise<void> {
    await this.selectTestData(testData);
    // Set strength and validity scores before submitting (required by the stub)
    await this.setEvidenceScores({
      strengthHours: '3',
      validityMinutes: '2'
    });
    await this.submitData();
  }
}
