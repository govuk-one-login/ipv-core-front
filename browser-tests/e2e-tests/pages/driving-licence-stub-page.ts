import { StubPage } from './stub-page';

export class DrivingLicenceStubPage extends StubPage {
  async expectDrivingLicenceStub(): Promise<void> {
    await this.expectHeading('Driving Licence (Stub)');
  }

  async processAliceParkerValid(): Promise<void> {
    await this.selectTestData('Alice Parker (Valid) DVLA Licence');
    await this.setEvidenceScores({
      strengthHours: '3',
      validityMinutes: '2',
      activityHistorySeconds: '1'
    });
    await this.submitData();
  }

  async processAliceParkerNameChange(): Promise<void> {
    await this.selectTestData('Alice Parker (Changed First Name) DVLA Licence');
    await this.setEvidenceScores({
      strengthHours: '3',
      validityMinutes: '2',
      activityHistorySeconds: '1'
    });
    await this.submitData();
  }
}