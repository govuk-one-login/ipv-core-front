import { StubPage } from './stub-page';

export class DocCheckingPage extends StubPage {
  async processAliceParkerValidInitial(): Promise<void> {
    await this.page.locator('#test_data').click();
    await this.selectTestData('Alice Parker (Valid) DVLA Licence');
    await this.setEvidenceScores({
      strengthHours: '3',
      validityMinutes: '2',
      activityHistorySeconds: '1',
      biometricVerification: '3'
    });
    await this.submitData();
  }

  async processAliceParkerNameChangeInitial(): Promise<void> {
    await this.selectTestData('Alice Parker (Changed First Name) DVLA Licence');
    await this.setEvidenceScores({
      strengthHours: '3',
      validityMinutes: '2',
      activityHistorySeconds: '1',
      biometricVerification: '3'
    });
    await this.submitData();
  }
}
